-- ==========================================================
-- SMART COLLEGE ATTENDANCE MANAGEMENT SYSTEM 
-- MS SQL SERVER SCRIPT
-- ==========================================================

CREATE DATABASE Smart_College_Attendance_System;
GO

USE Smart_College_Attendance_System;
GO

-- ==========================================================
-- 1. TABLE CREATION & DATA INSERTION (USER SCHEMA)
-- ==========================================================

CREATE TABLE Departments (
department_id INT PRIMARY KEY,
department_name VARCHAR(100)
);

INSERT INTO Departments VALUES
(1,'Computer Science'),
(2,'Electronics'),
(3,'Mechanical'),
(4,'Civil'),
(5,'Information Technology');

CREATE TABLE Faculty (
faculty_id INT PRIMARY KEY,
name VARCHAR(100),
department_id INT,
FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

INSERT INTO Faculty VALUES
(201,'Dr Mehta',1),
(202,'Prof Rao',2),
(203,'Dr Gupta',1),
(204,'Prof Sharma',3),
(205,'Dr Iyer',4),
(206,'Prof Singh',5),
(207,'Dr Kapoor',1),
(208,'Prof Jain',2);

CREATE TABLE Students (
student_id INT PRIMARY KEY,
name VARCHAR(100),
year INT,
section VARCHAR(5),
department_id INT,
mentor_id INT,
FOREIGN KEY (department_id) REFERENCES Departments(department_id),
FOREIGN KEY (mentor_id) REFERENCES Faculty(faculty_id)
);

INSERT INTO Students VALUES
(101,'Amit Sharma',2,'A',1,201),
(102,'Priya Singh',2,'A',1,201),
(103,'Rahul Verma',1,'B',2,202),
(104,'Neha Gupta',3,'A',1,203),
(105,'Arjun Patel',2,'B',3,204),
(106,'Sneha Joshi',1,'A',4,205),
(107,'Rohit Kumar',3,'B',5,206),
(108,'Pooja Nair',2,'A',1,203),
(109,'Vikram Shah',1,'C',2,202),
(110,'Anjali Mehta',3,'A',5,206);

CREATE TABLE Subjects (
subject_id INT PRIMARY KEY,
subject_name VARCHAR(100),
faculty_id INT,
department_id INT,
FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id),
FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

INSERT INTO Subjects VALUES
(301,'Database Management System',203,1),
(302,'Data Structures',201,1),
(303,'Digital Electronics',202,2),
(304,'Thermodynamics',204,3),
(305,'Structural Engineering',205,4),
(306,'Computer Networks',206,5);

CREATE TABLE Academic_Year (
year_id INT PRIMARY KEY,
year_name VARCHAR(20)
);

INSERT INTO Academic_Year VALUES
(1,'2024-2025'),
(2,'2025-2026');

CREATE TABLE Student_Enrollment (
enroll_id INT PRIMARY KEY,
student_id INT,
subject_id INT,
year_id INT,
FOREIGN KEY (student_id) REFERENCES Students(student_id),
FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
FOREIGN KEY (year_id) REFERENCES Academic_Year(year_id)
);

INSERT INTO Student_Enrollment VALUES
(401,101,301,2),
(402,102,301,2),
(403,103,303,2),
(404,104,302,2),
(405,105,304,2),
(406,106,305,2),
(407,107,306,2),
(408,108,301,2),
(409,109,303,2),
(410,110,306,2);

CREATE TABLE Classes (
class_id INT PRIMARY KEY,
subject_id INT,
class_date DATE,
time_slot VARCHAR(20),
year_id INT,
FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
FOREIGN KEY (year_id) REFERENCES Academic_Year(year_id)
);

INSERT INTO Classes VALUES
(501,301,'2026-02-01','10:00',2),
(502,301,'2026-02-02','10:00',2),
(503,302,'2026-02-01','11:00',2),
(504,303,'2026-02-01','12:00',2),
(505,304,'2026-02-01','01:00',2),
(506,305,'2026-02-02','02:00',2),
(507,306,'2026-02-02','03:00',2);

CREATE TABLE Attendance (
attendance_id INT PRIMARY KEY,
enroll_id INT,
class_id INT,
status VARCHAR(10),
FOREIGN KEY (enroll_id) REFERENCES Student_Enrollment(enroll_id),
FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);

INSERT INTO Attendance VALUES
(601,401,501,'Present'),
(602,402,501,'Present'),
(603,403,504,'Absent'),
(604,404,503,'Present'),
(605,405,505,'Present'),
(606,406,506,'Absent'),
(607,407,507,'Present'),
(608,408,501,'Present'),
(609,409,504,'Absent'),
(610,410,507,'Present');

CREATE TABLE Attendance_Summary (
summary_id INT PRIMARY KEY,
enroll_id INT UNIQUE,
total_classes INT,
classes_present INT,
percentage DECIMAL(5,2),
FOREIGN KEY (enroll_id) REFERENCES Student_Enrollment(enroll_id)
);

INSERT INTO Attendance_Summary VALUES
(701,401,10,8,80),
(702,402,10,9,90),
(703,403,10,6,60),
(704,404,10,8,80),
(705,405,10,7,70);

CREATE TABLE D_BAR (
dbar_id INT PRIMARY KEY,
student_id INT,
percentage DECIMAL(5,2),
alert_message VARCHAR(200),
alert_date DATE,
FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

INSERT INTO D_BAR VALUES
(801,103,60,'Attendance below 80%', '2026-02-10'),
(802,105,70,'Attendance below 80%', '2026-02-10');

GO

-- ==========================================================
-- 2. 40 BRAND NEW SQL QUERIES TAILORED TO THIS DATA
-- ==========================================================

-- Q1. Basic Query: Retrieve all 'Computer Science' students (assuming department_id 1 is CS).
SELECT * FROM Students WHERE department_id = 1;

-- Q2. Basic Query: Retrieve faculty names along with their assigned department IDs.
SELECT name AS Faculty_Name, department_id FROM Faculty;

-- Q3. Constraints: Test CHECK constraint by attempting to add a constraint to D_BAR percentages.
ALTER TABLE D_BAR ADD CONSTRAINT CHK_Percentage CHECK (percentage <= 100.00);

-- Q4. ALTER Table: Add an 'email_address' column to the Faculty table.
ALTER TABLE Faculty ADD email_address VARCHAR(100);

-- Q5. ALTER Table: Modify the data type of the new 'email_address' column.
ALTER TABLE Faculty ALTER COLUMN email_address VARCHAR(150);

-- Q6. UPDATE: Add an email address specifically for 'Dr Mehta' (faculty_id 201).
UPDATE Faculty SET email_address = 'dr.mehta@college.edu' WHERE faculty_id = 201;

-- Q7. DELETE: Safely remove a class schedule that happened on '2026-02-02' at '10:00' (class_id 502) and its attendance.
DELETE FROM Attendance WHERE class_id = 502;
DELETE FROM Classes WHERE class_id = 502;

-- Q8. Aggregate Function: Count the number of students mentored by 'Prof Rao' (faculty_id 202).
SELECT COUNT(*) AS Rao_Mentees FROM Students WHERE mentor_id = 202;

-- Q9. Aggregate Function: Find the lowest attendance percentage among all students in the summary.
SELECT MIN(percentage) AS Lowest_Attendance FROM Attendance_Summary;

-- Q10. Aggregate Function: Find the average number of classes attended by the enrolled students.
SELECT AVG(classes_present) AS Avg_Classes_Present FROM Attendance_Summary;

-- Q11. Aggregate Function: Calculate the total sum of classes conducted overall in the summary table.
SELECT SUM(total_classes) AS Overall_Conducted_Count FROM Attendance_Summary;

-- Q12. INNER JOIN: Retrieve all students alongside their designated mentor's name.
SELECT s.name AS Student_Name, f.name AS Mentor_Name 
FROM Students s 
INNER JOIN Faculty f ON s.mentor_id = f.faculty_id;

-- Q13. LEFT JOIN: List all subjects and the names of any students enrolled in them (if any).
SELECT sub.subject_name, s.name AS Enrolled_Student
FROM Subjects sub
LEFT JOIN Student_Enrollment se ON sub.subject_id = se.subject_id
LEFT JOIN Students s ON se.student_id = s.student_id;

-- Q14. RIGHT JOIN: List all Academic Years and any classes scheduled within them.
SELECT a.year_name, c.class_date, c.time_slot
FROM Classes c
RIGHT JOIN Academic_Year a ON c.year_id = a.year_id;

-- Q15. FULL OUTER JOIN: Retrieve a full report tying D_BAR alerts and student names, whether they have an alert or not.
SELECT s.name as Student, d.alert_message, d.percentage
FROM D_BAR d
FULL OUTER JOIN Students s ON d.student_id = s.student_id;

-- Q16. Subquery (IN): Find the names of students taking 'Thermodynamics'.
SELECT name AS Thermo_Students FROM Students 
WHERE student_id IN (
    SELECT student_id FROM Student_Enrollment 
    WHERE subject_id = (SELECT subject_id FROM Subjects WHERE subject_name = 'Thermodynamics')
);

-- Q17. Subquery (NOT IN): Find faculties who are NOT currently assigned to teach any subject.
SELECT name AS Idle_Faculty FROM Faculty 
WHERE faculty_id NOT IN (SELECT faculty_id FROM Subjects);

-- Q18. Subquery (EXISTS): List departments that currently have 3rd-year students enrolled.
SELECT department_name FROM Departments d
WHERE EXISTS (
    SELECT 1 FROM Students s WHERE s.department_id = d.department_id AND s.year = 3
);

-- Q19. Subquery (NOT EXISTS): Find students perfectly attending - i.e., who have no 'Absent' records.
SELECT s.name AS Perfect_Attendance_Students FROM Students s
WHERE NOT EXISTS (
    SELECT 1 FROM Student_Enrollment se 
    JOIN Attendance a ON se.enroll_id = a.enroll_id
    WHERE se.student_id = s.student_id AND a.status = 'Absent'
);

-- Q20. Subquery (ALL): Find students whose year is strictly higher than all students in the Electronics department (dept 2).
SELECT name, year FROM Students 
WHERE year > ALL (SELECT year FROM Students WHERE department_id = 2);

-- Q21. Subquery (ANY): Find the names of faculties belonging to the same department as 'Pooja Nair' (student 108).
SELECT name AS Faculty_Colleagues FROM Faculty 
WHERE department_id = ANY (SELECT department_id FROM Students WHERE student_id = 108);

-- Q22. Set Operation (UNION): Combine emails of specific faculties and generic department contacts.
SELECT name, 'Mentor' AS Type FROM Faculty WHERE faculty_id IN (201, 202)
UNION
SELECT name, 'Student' AS Type FROM Students WHERE year = 1;

-- Q23. Set Operation (UNION ALL): Retrieve a combined raw list of all department IDs used in Subjects and Faculty.
SELECT department_id FROM Subjects
UNION ALL
SELECT department_id FROM Faculty;

-- Q24. Set Operation (INTERSECT): Find standard faculty_ids who are both Mentors and Subject Teachers simultaneously.
SELECT mentor_id AS Dual_Role_Faculty FROM Students
INTERSECT
SELECT faculty_id FROM Subjects;

-- Q25. Set Operation (EXCEPT): Find Mentors who are solely mentoring and NOT teaching any specific Subject.
SELECT mentor_id AS Only_Mentor FROM Students
EXCEPT
SELECT faculty_id FROM Subjects;

-- Q26. View Creation: Create a quick-access 'Defaulter_View' combining Students, Departments, and D_BAR details.
GO
CREATE VIEW Vw_Active_Defaulters AS
SELECT s.name AS StudentName, d.department_name, db.percentage, db.alert_date
FROM D_BAR db
JOIN Students s ON db.student_id = s.student_id
JOIN Departments d ON s.department_id = d.department_id;
GO

-- Q27. Query the View: Run a check on the 'Defaulter_View'.
SELECT * FROM Vw_Active_Defaulters WHERE percentage <= 60.00;

-- Q28. Date Function (GETDATE): Retrieve the exact system timestamp of when the query runs.
SELECT GETDATE() AS Report_Generation_Time;

-- Q29. Date Function (DATEDIFF): Calculate how many days have passed since the D_BAR alerts were issued on '2026-02-10'.
SELECT student_id, alert_message, DATEDIFF(DAY, alert_date, GETDATE()) AS Days_Since_Alert FROM D_BAR;

-- Q30. Date Function (MONTH/YEAR): Find all specific classes that were scheduled and held in February 2026.
SELECT class_id, time_slot, subject_id FROM Classes 
WHERE MONTH(class_date) = 2 AND YEAR(class_date) = 2026;

-- Q31. BETWEEN: Retrieve all classes happening in the morning slots between '10:00' and '12:00'.
SELECT * FROM Classes WHERE time_slot BETWEEN '10:00' AND '12:00';

-- Q32. LIMIT (TOP in SQL Server): Get the top 5 students ordered alphabetically by their names.
SELECT TOP 5 student_id, name, year FROM Students ORDER BY name ASC;

-- Q33. LIMIT (OFFSET/FETCH): Skip the first 3 students and fetch the next 4 students (Pagination logic snippet).
SELECT * FROM Students ORDER BY student_id
OFFSET 3 ROWS FETCH NEXT 4 ROWS ONLY;

-- Q34. GROUP BY with HAVING: Find faculties who mentor more than 1 student concurrently.
SELECT mentor_id, COUNT(student_id) AS Mentee_Count 
FROM Students 
GROUP BY mentor_id 
HAVING COUNT(student_id) > 1;

-- Q35. Pattern Matching (LIKE): Search for students whose full name ends with the surname 'Singh'.
SELECT * FROM Students WHERE name LIKE '%Singh';

-- Q36. Multiple JOINs: Extensive tracing of 'Rahul Verma''s (103) attendance log down to the subject name and date.
SELECT s.name, sub.subject_name, c.class_date, a.status
FROM Attendance a
JOIN Classes c ON a.class_id = c.class_id
JOIN Student_Enrollment se ON a.enroll_id = se.enroll_id
JOIN Students s ON se.student_id = s.student_id
JOIN Subjects sub ON se.subject_id = sub.subject_id
WHERE s.name = 'Rahul Verma';

-- Q37. UPDATE with JOIN: Automatically update D_BAR warning messages dynamically if percentage falls to exactly 60%.
UPDATE db
SET db.alert_message = 'URGENT: CRITICAL ATTENDANCE FALLEN TRAGICALLY LOW'
FROM D_BAR db
JOIN Students s ON db.student_id = s.student_id
WHERE db.percentage = 60.00;

-- Q38. Math operation in SELECT: Mathematically deduce how many specific classes a student originally missed representing it actively.
SELECT enroll_id, (total_classes - classes_present) AS Calculated_Missed_Classes
FROM Attendance_Summary;

-- Q39. ORDER BY Multiple columns: Categorize the student roster effectively by ordering by Department first, then by Academic Year alphabetically.
SELECT * FROM Students ORDER BY department_id ASC, year DESC;

-- Q40. DROP (View): Drop the 'Vw_Active_Defaulters' view to clean up the workspace successfully.
DROP VIEW Vw_Active_Defaulters;
