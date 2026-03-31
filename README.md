# Attendance Management System

This project contains:
- `frontend/` (static admin UI)
- `backend/` (Node.js + Express API)

## Database Connection Setup (MySQL)

The backend is configured to use MySQL through environment variables.

### 1. Prerequisites

- Node.js 18+
- MySQL 8+
- A MySQL user with permissions to create/use the target database

### 2. Create Database

Run this in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS smart_college_attendance_system;
```

### 3. Create/Import Tables

Important:
- The file `database_queries.sql` contains SQL Server syntax.
- It is not directly compatible with MySQL.

Use one of these options:
- Option A: Import a MySQL-compatible schema/dump for the same tables.
- Option B: Convert `database_queries.sql` to MySQL syntax, then import it.

Required tables used by the backend:
- `Departments`
- `Faculty`
- `Students`
- `Subjects`
- `Academic_Year`
- `Student_Enrollment`
- `Classes`
- `Attendance`
- `Attendance_Summary`
- `D_BAR`

### 4. Configure Backend Environment

From `backend/`, copy `.env.example` to `.env` and update values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_college_attendance_system
DB_POOL_SIZE=10
ATTENDANCE_THRESHOLD=80
CORS_ORIGIN=*
PORT=5000
```

### 5. Install and Start Backend

```bash
cd backend
npm install
npm start
```

If DB settings are valid, server starts on `PORT` (default `5000`).

### 6. Start Frontend

```bash
cd frontend
npm install
npm run build
```

For static pages, open:
- `frontend/index.html`

## API Base URL

Frontend currently calls:
- `http://localhost:5000/api`

So backend must be running on `localhost:5000` unless frontend API URL is changed.
