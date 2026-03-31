const { sql, poolPromise } = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        const totalStudents = await pool.request().query('SELECT COUNT(*) AS count FROM Students');
        const totalSubjects = await pool.request().query('SELECT COUNT(*) AS count FROM Subjects');
        const totalClasses = await pool.request().query('SELECT COUNT(*) AS count FROM Classes');
        const avgAttendance = await pool.request().query('SELECT AVG(percentage) AS avg_percent FROM Attendance_Summary');
        const defaulters = await pool.request().query('SELECT COUNT(*) AS count FROM Attendance_Summary WHERE percentage < 80');

        res.json({
            students: totalStudents.recordset[0].count,
            subjects: totalSubjects.recordset[0].count,
            classes: totalClasses.recordset[0].count,
            attendance: avgAttendance.recordset[0].avg_percent || 0,
            defaulters: defaulters.recordset[0].count
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
};


// STUDENTS
exports.getStudents = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT s.student_id, s.name, s.year, s.section, d.department_name 
            FROM Students s
            JOIN Departments d ON s.department_id = d.department_id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.addStudent = async (req, res) => {
    const { name, year, section, department_id } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('year', sql.Int, year)
            .input('section', sql.VarChar, section)
            .input('dept', sql.Int, department_id)
            .query('INSERT INTO Students (student_id, name, year, section, department_id) VALUES ((SELECT ISNULL(MAX(student_id),0)+1 FROM Students), @name, @year, @section, @dept)');
        res.status(201).json({ message: 'Student created' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.updateStudent = async (req, res) => {
    const { id } = req.params;
    const { name, year, section, department_id } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.VarChar, name)
            .input('year', sql.Int, year)
            .input('section', sql.VarChar, section)
            .input('dept', sql.Int, department_id)
            .query('UPDATE Students SET name=@name, year=@year, section=@section, department_id=@dept WHERE student_id=@id');
        res.json({ message: 'Student updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Students WHERE student_id=@id');
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// FACULTY
exports.getFaculty = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT f.faculty_id, f.name, d.department_name 
            FROM Faculty f
            JOIN Departments d ON f.department_id = d.department_id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.addFaculty = async (req, res) => {
    const { name, department_id } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('dept', sql.Int, department_id)
            .query('INSERT INTO Faculty (faculty_id, name, department_id) VALUES ((SELECT ISNULL(MAX(faculty_id),0)+1 FROM Faculty), @name, @dept)');
        res.status(201).json({ message: 'Faculty created' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// SUBJECTS
exports.getSubjects = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT s.subject_id, s.subject_name, f.name as faculty_name 
            FROM Subjects s
            JOIN Faculty f ON s.faculty_id = f.faculty_id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.addSubject = async (req, res) => {
    const { subject_name, faculty_id, department_id } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.VarChar, subject_name)
            .input('fid', sql.Int, faculty_id)
            .input('did', sql.Int, department_id)
            .query('INSERT INTO Subjects (subject_id, subject_name, faculty_id, department_id) VALUES ((SELECT ISNULL(MAX(subject_id),0)+1 FROM Subjects), @name, @fid, @did)');
        res.status(201).json({ message: 'Subject created' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// ATTENDANCE & CLASSES
exports.getClasses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.class_id, sb.subject_name, c.class_date, c.time_slot
            FROM Classes c
            JOIN Subjects sb ON c.subject_id = sb.subject_id
            ORDER BY c.class_date DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getEnrolledStudentsForClass = async (req, res) => {
    const { class_id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('cid', sql.Int, class_id)
            .query(`
                SELECT e.enroll_id, s.name, s.student_id
                FROM Student_Enrollment e
                JOIN Students s ON e.student_id = s.student_id
                JOIN Classes c ON e.subject_id = c.subject_id
                WHERE c.class_id = @cid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.markAttendance = async (req, res) => {
    const { class_id, records } = req.body; // records: [{enroll_id, status}]
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (let r of records) {
                // Upsert or insert attendance
                await transaction.request()
                    .input('eid', sql.Int, r.enroll_id)
                    .input('cid', sql.Int, class_id)
                    .input('stat', sql.VarChar, r.status)
                    .query(`
                        IF EXISTS (SELECT * FROM Attendance WHERE enroll_id=@eid AND class_id=@cid)
                            UPDATE Attendance SET status=@stat WHERE enroll_id=@eid AND class_id=@cid
                        ELSE
                            INSERT INTO Attendance (attendance_id, enroll_id, class_id, status) VALUES ((SELECT ISNULL(MAX(attendance_id),0)+1 FROM Attendance), @eid, @cid, @stat)
                    `);
            }

            // Trigger summary update logic here
            await transaction.request().query(`
                UPDATE Attendance_Summary
                SET classes_present = (SELECT COUNT(*) FROM Attendance WHERE enroll_id = Attendance_Summary.enroll_id AND status = 'Present'),
                    total_classes = (SELECT COUNT(*) FROM Attendance WHERE enroll_id = Attendance_Summary.enroll_id),
                    percentage = (CAST((SELECT COUNT(*) FROM Attendance WHERE enroll_id = Attendance_Summary.enroll_id AND status = 'Present') AS DECIMAL(5,2)) / NULLIF((SELECT COUNT(*) FROM Attendance WHERE enroll_id = Attendance_Summary.enroll_id), 0)) * 100
                WHERE enroll_id IN (SELECT enroll_id FROM Attendance WHERE class_id = ${class_id})
            `);

            await transaction.commit();
            res.json({ message: 'Attendance marked successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT s.name as student_name, sub.subject_name, a.total_classes, a.classes_present, a.percentage
            FROM Attendance_Summary a
            JOIN Student_Enrollment se ON a.enroll_id = se.enroll_id
            JOIN Students s ON se.student_id = s.student_id
            JOIN Subjects sub ON se.subject_id = sub.subject_id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getDefaulters = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT s.student_id, s.name as student_name, sub.subject_name, a.percentage
            FROM Attendance_Summary a
            JOIN Student_Enrollment se ON a.enroll_id = se.enroll_id
            JOIN Students s ON se.student_id = s.student_id
            JOIN Subjects sub ON se.subject_id = sub.subject_id
            WHERE a.percentage < 80 OR a.total_classes = 0
            ORDER BY a.percentage ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Departments');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};
