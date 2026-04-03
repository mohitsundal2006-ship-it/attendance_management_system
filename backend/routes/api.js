const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const ATTENDANCE_THRESHOLD = Number(process.env.ATTENDANCE_THRESHOLD || 80);

const asyncWrap = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    });
};

function toInt(value, fieldName) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) {
        throw new Error(`Invalid ${fieldName}.`);
    }
    return parsed;
}

async function getNextId(connection, tableName, idColumn) {
    const [rows] = await connection.query(
        `SELECT COALESCE(MAX(${idColumn}), 0) + 1 AS next_id FROM ${tableName} FOR UPDATE`
    );
    return rows[0].next_id;
}

async function resolveMentorId(connection, departmentId, requestedMentorId) {
    if (requestedMentorId !== undefined && requestedMentorId !== null && requestedMentorId !== '') {
        const mentorId = toInt(requestedMentorId, 'mentor_id');
        const [mentorRows] = await connection.query(
            'SELECT faculty_id FROM Faculty WHERE faculty_id = ? AND department_id = ? LIMIT 1',
            [mentorId, departmentId]
        );
        if (mentorRows.length === 0) {
            throw new Error('Provided mentor_id is invalid for the selected department.');
        }
        return mentorId;
    }

    const [departmentMentors] = await connection.query(
        'SELECT faculty_id FROM Faculty WHERE department_id = ? ORDER BY faculty_id ASC LIMIT 1',
        [departmentId]
    );
    if (departmentMentors.length > 0) {
        return departmentMentors[0].faculty_id;
    }

    const [fallbackMentor] = await connection.query(
        'SELECT faculty_id FROM Faculty ORDER BY faculty_id ASC LIMIT 1'
    );
    if (fallbackMentor.length === 0) {
        throw new Error('No faculty record exists to assign as mentor.');
    }

    return fallbackMentor[0].faculty_id;
}

async function refreshEnrollmentSummary(connection, enrollId) {
    const [attendanceStats] = await connection.query(
        `
        SELECT
            COUNT(*) AS total_classes,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS classes_present
        FROM Attendance
        WHERE enroll_id = ?
        `,
        [enrollId]
    );

    const totalClasses = Number(attendanceStats[0].total_classes || 0);
    const classesPresent = Number(attendanceStats[0].classes_present || 0);
    const percentage = totalClasses > 0
        ? Number(((classesPresent * 100) / totalClasses).toFixed(2))
        : 0;

    const [existingSummary] = await connection.query(
        'SELECT summary_id FROM Attendance_Summary WHERE enroll_id = ? LIMIT 1',
        [enrollId]
    );

    if (existingSummary.length > 0) {
        await connection.query(
            `
            UPDATE Attendance_Summary
            SET total_classes = ?, classes_present = ?, percentage = ?
            WHERE enroll_id = ?
            `,
            [totalClasses, classesPresent, percentage, enrollId]
        );
        return;
    }

    const summaryId = await getNextId(connection, 'Attendance_Summary', 'summary_id');
    await connection.query(
        `
        INSERT INTO Attendance_Summary (summary_id, enroll_id, total_classes, classes_present, percentage)
        VALUES (?, ?, ?, ?, ?)
        `,
        [summaryId, enrollId, totalClasses, classesPresent, percentage]
    );
}

async function refreshDefaulterStatus(connection, studentId) {
    const [studentAttendance] = await connection.query(
        `
        SELECT AVG(asu.percentage) AS avg_percentage
        FROM Attendance_Summary asu
        JOIN Student_Enrollment se ON asu.enroll_id = se.enroll_id
        WHERE se.student_id = ?
        `,
        [studentId]
    );

    const avgPercentage = Number(studentAttendance[0].avg_percentage || 0);
    if (avgPercentage < ATTENDANCE_THRESHOLD) {
        const [existingRecord] = await connection.query(
            'SELECT dbar_id FROM D_BAR WHERE student_id = ? LIMIT 1',
            [studentId]
        );

        if (existingRecord.length > 0) {
            await connection.query(
                `
                UPDATE D_BAR
                SET percentage = ?, alert_message = ?, alert_date = CURDATE()
                WHERE student_id = ?
                `,
                [avgPercentage, `Attendance below ${ATTENDANCE_THRESHOLD}%`, studentId]
            );
        } else {
            const dbarId = await getNextId(connection, 'D_BAR', 'dbar_id');
            await connection.query(
                `
                INSERT INTO D_BAR (dbar_id, student_id, percentage, alert_message, alert_date)
                VALUES (?, ?, ?, ?, CURDATE())
                `,
                [dbarId, studentId, avgPercentage, `Attendance below ${ATTENDANCE_THRESHOLD}%`]
            );
        }
        return;
    }

    await connection.query('DELETE FROM D_BAR WHERE student_id = ?', [studentId]);
}

router.get('/dashboard', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    if (role === 'student') {
        const [subRows] = await pool.query('SELECT COUNT(*) AS count FROM Student_Enrollment WHERE student_id = ?', [userId]);
        const [attRows] = await pool.query(`
            SELECT AVG(percentage) as avg_att FROM Attendance_Summary asu 
            JOIN Student_Enrollment se ON asu.enroll_id = se.enroll_id 
            WHERE se.student_id = ?
        `, [userId]);
        
        res.json({
            subjects: Number(subRows[0].count || 0),
            attendance: Number(attRows[0].avg_att || 0)
        });
    } else if (role === 'faculty') {
        const [stuRows] = await pool.query(`
            SELECT COUNT(DISTINCT se.student_id) AS count 
            FROM Student_Enrollment se
            JOIN Subjects sub ON se.subject_id = sub.subject_id
            WHERE sub.faculty_id = ?
        `, [userId]);
        const [subRows] = await pool.query('SELECT COUNT(*) AS count FROM Subjects WHERE faculty_id = ?', [userId]);
        const [classesRows] = await pool.query('SELECT COUNT(*) AS count FROM Classes c JOIN Subjects s ON c.subject_id=s.subject_id WHERE s.faculty_id = ?', [userId]);
        
        res.json({
            students: Number(stuRows[0].count || 0),
            subjects: Number(subRows[0].count || 0),
            classes: Number(classesRows[0].count || 0)
        });
    } else {
        res.json({});
    }
}));

router.get('/departments', asyncWrap(async (_req, res) => {
    const [rows] = await pool.query('SELECT * FROM Departments ORDER BY department_id');
    res.json(rows);
}));

router.get('/students', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    if (role === 'faculty') {
        const query = `
            SELECT s.student_id, s.name, s.year, s.section, s.department_id, s.mentor_id, d.department_name, 
                   GROUP_CONCAT(sub.subject_name SEPARATOR ', ') AS subjects_taught
            FROM Students s
            LEFT JOIN Departments d ON s.department_id = d.department_id
            JOIN Student_Enrollment se ON s.student_id = se.student_id
            JOIN Subjects sub ON se.subject_id = sub.subject_id
            WHERE sub.faculty_id = ?
            GROUP BY s.student_id
            ORDER BY s.student_id
        `;
        const [rows] = await pool.query(query, [userId]);
        return res.json(rows);
    }

    let query = `
        SELECT s.student_id, s.name, s.year, s.section, s.department_id, s.mentor_id, d.department_name
        FROM Students s
        LEFT JOIN Departments d ON s.department_id = d.department_id
    `;
    let params = [];

    if (role === 'student') {
        query += ` WHERE s.student_id = ?`;
        params.push(userId);
    }

    query += ` ORDER BY s.student_id`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

router.post('/students', asyncWrap(async (req, res) => {
    const { name, year, section, department_id, mentor_id, subject_ids } = req.body;
    if (!name || !year || !section || !department_id) {
        return res.status(400).json({ error: 'name, year, section and department_id are required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const departmentId = toInt(department_id, 'department_id');
        const yearValue = toInt(year, 'year');
        const mentorId = await resolveMentorId(connection, departmentId, mentor_id);
        const studentId = await getNextId(connection, 'Students', 'student_id');

        await connection.query(
            `
            INSERT INTO Students (student_id, name, year, section, department_id, mentor_id)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [studentId, String(name).trim(), yearValue, String(section).trim(), departmentId, mentorId]
        );

        if (Array.isArray(subject_ids) && subject_ids.length > 0) {
            for (const subjectIdStr of subject_ids) {
                const subjectId = toInt(subjectIdStr, 'subject_id');
                const enrollId = await getNextId(connection, 'Student_Enrollment', 'enroll_id');
                await connection.query(
                    `
                    INSERT INTO Student_Enrollment (enroll_id, student_id, subject_id, year_id)
                    VALUES (?, ?, ?, ?)
                    `,
                    [enrollId, studentId, subjectId, 2]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, student_id: studentId, mentor_id: mentorId });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

router.delete('/students/:id', asyncWrap(async (req, res) => {
    const studentId = toInt(req.params.id, 'student_id');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            'DELETE FROM Attendance_Summary WHERE enroll_id IN (SELECT enroll_id FROM Student_Enrollment WHERE student_id = ?)',
            [studentId]
        );
        await connection.query(
            'DELETE FROM Attendance WHERE enroll_id IN (SELECT enroll_id FROM Student_Enrollment WHERE student_id = ?)',
            [studentId]
        );
        await connection.query('DELETE FROM Student_Enrollment WHERE student_id = ?', [studentId]);
        await connection.query('DELETE FROM D_BAR WHERE student_id = ?', [studentId]);
        const [deleteResult] = await connection.query('DELETE FROM Students WHERE student_id = ?', [studentId]);

        await connection.commit();

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Student not found.' });
        }

        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

router.get('/faculty', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    let query = `
        SELECT f.faculty_id, f.name, f.department_id, d.department_name
        FROM Faculty f
        LEFT JOIN Departments d ON f.department_id = d.department_id
    `;
    let params = [];

    if (role === 'faculty') {
        query += ` WHERE f.faculty_id = ?`;
        params.push(userId);
    } else if (role === 'student') {
        query += `
            WHERE f.faculty_id IN (
                SELECT sub.faculty_id FROM Subjects sub
                JOIN Student_Enrollment se ON sub.subject_id = se.subject_id
                WHERE se.student_id = ?
            )
        `;
        params.push(userId);
    }

    query += ` ORDER BY f.faculty_id`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

router.get('/subjects', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    let query = `
        SELECT s.subject_id, s.subject_name, s.department_id, d.department_name, s.faculty_id, f.name AS faculty_name
        FROM Subjects s
        LEFT JOIN Faculty f ON s.faculty_id = f.faculty_id
        LEFT JOIN Departments d ON s.department_id = d.department_id
    `;
    let params = [];

    if (role === 'faculty') {
        query += ` WHERE s.faculty_id = ?`;
        params.push(userId);
    } else if (role === 'student') {
        query += `
            WHERE s.subject_id IN (
                SELECT subject_id FROM Student_Enrollment WHERE student_id = ?
            )
        `;
        params.push(userId);
    }

    query += ` ORDER BY s.subject_id`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

router.get('/classes', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    let query = `
        SELECT c.class_id, c.subject_id, s.subject_name, c.class_date, c.time_slot
        FROM Classes c
        JOIN Subjects s ON c.subject_id = s.subject_id
    `;
    let params = [];

    if (role === 'faculty') {
        query += ` WHERE s.faculty_id = ?`;
        params.push(userId);
    } else if (role === 'student') {
        query += `
            WHERE c.subject_id IN (
                SELECT subject_id FROM Student_Enrollment WHERE student_id = ?
            )
        `;
        params.push(userId);
    }

    query += ` ORDER BY c.class_date DESC, c.class_id DESC`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

router.get('/classes/:id/students', asyncWrap(async (req, res) => {
    const classId = toInt(req.params.id, 'class_id');

    const [rows] = await pool.query(
        `
        SELECT se.enroll_id, std.student_id, std.name
        FROM Student_Enrollment se
        JOIN Students std ON se.student_id = std.student_id
        WHERE se.subject_id = (SELECT subject_id FROM Classes WHERE class_id = ?)
        ORDER BY std.student_id
        `,
        [classId]
    );

    res.json(rows);
}));

router.post('/attendance', asyncWrap(async (req, res) => {
    const { class_id, records } = req.body;
    if (!class_id || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'class_id and records are required.' });
    }

    const classId = toInt(class_id, 'class_id');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const touchedEnrollIds = new Set();

        for (const record of records) {
            const enrollId = toInt(record.enroll_id, 'enroll_id');
            const status = record.status === 'Absent' ? 'Absent' : 'Present';
            touchedEnrollIds.add(enrollId);

            const [existingAttendance] = await connection.query(
                'SELECT attendance_id FROM Attendance WHERE enroll_id = ? AND class_id = ? LIMIT 1',
                [enrollId, classId]
            );

            if (existingAttendance.length > 0) {
                await connection.query(
                    'UPDATE Attendance SET status = ? WHERE attendance_id = ?',
                    [status, existingAttendance[0].attendance_id]
                );
            } else {
                const attendanceId = await getNextId(connection, 'Attendance', 'attendance_id');
                await connection.query(
                    'INSERT INTO Attendance (attendance_id, enroll_id, class_id, status) VALUES (?, ?, ?, ?)',
                    [attendanceId, enrollId, classId, status]
                );
            }
        }

        for (const enrollId of touchedEnrollIds) {
            await refreshEnrollmentSummary(connection, enrollId);
            const [studentRows] = await connection.query(
                'SELECT student_id FROM Student_Enrollment WHERE enroll_id = ? LIMIT 1',
                [enrollId]
            );
            if (studentRows.length > 0) {
                await refreshDefaulterStatus(connection, studentRows[0].student_id);
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

router.get('/attendance/summary', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    let query = `
        SELECT s.name AS student_name, sub.subject_name, asu.total_classes, asu.classes_present, asu.percentage
        FROM Attendance_Summary asu
        JOIN Student_Enrollment se ON asu.enroll_id = se.enroll_id
        JOIN Students s ON se.student_id = s.student_id
        JOIN Subjects sub ON se.subject_id = sub.subject_id
    `;
    let params = [];

    if (role === 'faculty') {
        query += ` WHERE sub.faculty_id = ?`;
        params.push(userId);
    } else if (role === 'student') {
        query += ` WHERE s.student_id = ?`;
        params.push(userId);
    }

    query += ` ORDER BY s.student_id, sub.subject_id`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

router.get('/defaulters', asyncWrap(async (req, res) => {
    const role = req.query.role;
    const userId = Number(req.query.user_id);

    let query = `
        SELECT s.student_id, s.name AS student_name, db.percentage, db.alert_message
        FROM D_BAR db
        JOIN Students s ON db.student_id = s.student_id
    `;
    let params = [];

    if (role === 'faculty') {
        query += `
            WHERE s.student_id IN (
                SELECT DISTINCT se.student_id FROM Student_Enrollment se
                JOIN Subjects sub ON se.subject_id = sub.subject_id
                WHERE sub.faculty_id = ?
            )
        `;
        params.push(userId);
    } else if (role === 'student') {
        query += ` WHERE s.student_id = ?`;
        params.push(userId);
    }

    query += ` ORDER BY db.percentage ASC, s.student_id ASC`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
}));

module.exports = router;
