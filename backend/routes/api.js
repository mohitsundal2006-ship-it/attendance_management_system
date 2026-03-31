const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Error Wrapper to capture unhandled promise rejections nicely
const asyncWrap = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error("API Error:", err);
        res.status(500).json({ error: err.message });
    });
};

// GET /api/dashboard
router.get('/dashboard', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const studentsRes = await pool.request().query('SELECT COUNT(*) AS count FROM Students');
    const subjectsRes = await pool.request().query('SELECT COUNT(*) AS count FROM Subjects');
    const attRes = await pool.request().query('SELECT AVG(percentage) AS avg_att FROM Attendance_Summary');
    const defRes = await pool.request().query('SELECT COUNT(*) AS count FROM D_BAR');
    res.json({
        students: studentsRes.recordset[0].count,
        subjects: subjectsRes.recordset[0].count,
        attendance: attRes.recordset[0].avg_att || 0,
        defaulters: defRes.recordset[0].count
    });
}));

// GET /api/departments
router.get('/departments', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Departments');
    res.json(result.recordset);
}));

// GET /api/students
router.get('/students', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT s.*, d.department_name 
        FROM Students s 
        LEFT JOIN Departments d ON s.department_id = d.department_id
    `);
    res.json(result.recordset);
}));

// POST /api/students
router.post('/students', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const { name, year, section, department_id } = req.body;
    
    // Auto-increment ID manually because SQL Server script didn't use IDENTITY trigger
    const idRes = await pool.request().query('SELECT ISNULL(MAX(student_id), 100) + 1 AS new_id FROM Students');
    const newId = idRes.recordset[0].new_id;
    const mentor_id = 201; // Example mentor id placeholder mapping

    await pool.request()
        .input('id', sql.Int, newId)
        .input('name', sql.VarChar, name)
        .input('year', sql.Int, parseInt(year))
        .input('section', sql.VarChar, section)
        .input('dept', sql.Int, parseInt(department_id))
        .input('mentor', sql.Int, mentor_id)
        .query(`
            INSERT INTO Students (student_id, name, year, section, department_id, mentor_id)
            VALUES (@id, @name, @year, @section, @dept, @mentor)
        `);
    res.json({ success: true, student_id: newId });
}));

// DELETE /api/students/:id
router.delete('/students/:id', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const id = req.params.id;
    
    // Clean up dependent foreign keys first sequentially
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Attendance_Summary WHERE enroll_id IN (SELECT enroll_id FROM Student_Enrollment WHERE student_id = @id)');
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Attendance WHERE enroll_id IN (SELECT enroll_id FROM Student_Enrollment WHERE student_id = @id)');
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Student_Enrollment WHERE student_id = @id');
    await pool.request().input('id', sql.Int, id).query('DELETE FROM D_BAR WHERE student_id = @id');
    
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Students WHERE student_id = @id');
    
    res.json({ success: true });
}));

// GET /api/faculty
router.get('/faculty', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT f.faculty_id, f.name, d.department_name 
        FROM Faculty f 
        LEFT JOIN Departments d ON f.department_id = d.department_id
    `);
    res.json(result.recordset);
}));

// GET /api/subjects
router.get('/subjects', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT s.subject_id, s.subject_name, f.name AS faculty_name 
        FROM Subjects s 
        LEFT JOIN Faculty f ON s.faculty_id = f.faculty_id
    `);
    res.json(result.recordset);
}));

// GET /api/classes
router.get('/classes', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT c.class_id, s.subject_name, c.class_date, c.time_slot 
        FROM Classes c 
        JOIN Subjects s ON c.subject_id = s.subject_id
    `);
    res.json(result.recordset);
}));

// GET /api/classes/:id/students
router.get('/classes/:id/students', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const classId = req.params.id;
    const result = await pool.request()
        .input('classId', sql.Int, classId)
        .query(`
            SELECT se.enroll_id, std.student_id, std.name 
            FROM Student_Enrollment se
            JOIN Students std ON se.student_id = std.student_id
            WHERE se.subject_id = (SELECT subject_id FROM Classes WHERE class_id = @classId)
        `);
    res.json(result.recordset);
}));

// POST /api/attendance
router.post('/attendance', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const { class_id, records } = req.body;
    
    const idRes = await pool.request().query('SELECT ISNULL(MAX(attendance_id), 600) AS max_id FROM Attendance');
    let attId = idRes.recordset[0].max_id;

    for (const record of records) {
        attId++;
        await pool.request()
            .input('id', sql.Int, attId)
            .input('enroll', sql.Int, record.enroll_id)
            .input('classId', sql.Int, class_id)
            .input('status', sql.VarChar, record.status)
            .query(`
                INSERT INTO Attendance (attendance_id, enroll_id, class_id, status)
                VALUES (@id, @enroll, @classId, @status)
            `);
    }
    res.json({ success: true });
}));

// GET /api/attendance/summary
router.get('/attendance/summary', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT s.name AS student_name, sub.subject_name, asu.total_classes, asu.classes_present, asu.percentage 
        FROM Attendance_Summary asu 
        JOIN Student_Enrollment se ON asu.enroll_id = se.enroll_id 
        JOIN Students s ON se.student_id = s.student_id 
        JOIN Subjects sub ON se.subject_id = sub.subject_id
    `);
    res.json(result.recordset);
}));

// GET /api/defaulters
router.get('/defaulters', asyncWrap(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT s.student_id, s.name AS student_name, db.percentage, db.alert_message 
        FROM D_BAR db 
        JOIN Students s ON db.student_id = s.student_id
    `);
    res.json(result.recordset);
}));

module.exports = router;