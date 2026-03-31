const API_BASE = 'http://localhost:5000/api';

// --- Generic Fetch Config ---
async function fetchAPI(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return null; // Silent catch, handle locally if needed
    }
}

// Dynamically create the sidebar navigation for all pages
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Keeping the exact styling requested from the user's snippet
        sidebar.innerHTML = `
            <div style="padding: 2rem; font-size: 1.5rem; font-weight: bold; color: var(--accent, #3b82f6); display: flex; align-items: center; gap: 10px;">
                <i data-lucide="graduation-cap"></i> Admin
            </div>
            <nav style="display: flex; flex-direction: column; gap: 5px; padding: 0 1rem;">
                <a href="dashboard.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="layout-dashboard"></i> Dashboard</a>
                <a href="students.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="users"></i> Students</a>
                <a href="faculty.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="user-check"></i> Faculty</a>
                <a href="subjects.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="book-open"></i> Subjects</a>
                <a href="attendance.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="calendar-check"></i> Mark Attendance</a>
                <a href="reports.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="file-text"></i> Reports</a>
                <a href="defaulters.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;"><i data-lucide="alert-triangle"></i> Defaulters</a>
            </nav>
            <div style="margin-top: auto; padding: 1rem;">
                <a href="index.html" class="btn btn-primary" style="display: flex; justify-content: center; align-items: center; gap: 10px; text-decoration: none; width: 100%; box-sizing: border-box;">
                    <i data-lucide="log-out"></i> Logout
                </a>
            </div>
        `;
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Dashboard ---
async function loadDashboard() {
    renderSidebar();
    const data = await fetchAPI('/dashboard');
    if (data) {
        document.getElementById('stat-students').innerText = data.students || 0;
        document.getElementById('stat-stats').innerText = data.subjects || 0; 
        document.getElementById('stat-attendance').innerText = parseFloat(data.attendance || 0).toFixed(1) + '%';
        document.getElementById('stat-defaulters').innerText = data.defaulters || 0;
    }
}

// --- Students ---
async function loadStudents() {
    renderSidebar();
    
    // Fetch students table
    const students = await fetchAPI('/students');
    const tbody = document.getElementById('students-body');
    if (students && tbody) {
        if(students.length === 0) tbody.innerHTML = `<tr><td colspan="5">No students found</td></tr>`;
        else {
            tbody.innerHTML = students.map(s => `
                <tr>
                    <td>${s.student_id}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>Year ${s.year} - Sec ${s.section}</td>
                    <td>${s.department_name || ''}</td>
                    <td>
                        <button class="btn btn-sm" style="background-color: var(--danger, #ef4444); color: white;" onclick="deleteStudent(${s.student_id})">
                            <i data-lucide="trash-2"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons(); // Re-render icon
        }
    }
    
    // Fetch departments for the add form select dropdown
    const depts = await fetchAPI('/departments');
    const select = document.getElementById('deptSelect');
    if (depts && select) {
        select.innerHTML = depts.map(d => `<option value="${d.department_id}">${d.department_name}</option>`).join('');
    }
}

async function addStudent(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('sName').value,
        year: document.getElementById('sYear').value,
        section: document.getElementById('sSection').value,
        department_id: document.getElementById('deptSelect').value
    };
    const res = await fetchAPI('/students', { method: 'POST', body: JSON.stringify(payload) });
    if (res && res.success) {
        closeModal('addModal');
        document.getElementById('addStudentForm').reset();
        loadStudents(); 
    } else {
        alert("Failed to add student. Check console.");
    }
}

async function deleteStudent(id) {
    if(confirm('Are you certain you wish to delete this student and all their academic records?')) {
        const res = await fetchAPI(`/students/${id}`, { method: 'DELETE' });
        if(res && res.success) {
            loadStudents();
        } else {
            alert("Failed to delete.");
        }
    }
}

// --- Faculty ---
async function loadFaculty() {
    renderSidebar();
    const faculty = await fetchAPI('/faculty');
    const tbody = document.getElementById('faculty-body');
    if (faculty && tbody) {
        tbody.innerHTML = faculty.length === 0 ? `<tr><td colspan="3">No faculty found</td></tr>` : faculty.map(f => `
            <tr>
                <td>${f.faculty_id}</td>
                <td><strong>${f.name}</strong></td>
                <td>${f.department_name || ''}</td>
            </tr>
        `).join('');
    }
}

// --- Subjects ---
async function loadSubjects() {
    renderSidebar();
    const subjects = await fetchAPI('/subjects');
    const tbody = document.getElementById('subjects-body');
    if (subjects && tbody) {
        tbody.innerHTML = subjects.length === 0 ? `<tr><td colspan="3">No subjects found</td></tr>` : subjects.map(s => `
            <tr>
                <td>${s.subject_id}</td>
                <td><strong>${s.subject_name}</strong></td>
                <td>${s.faculty_name || 'Unassigned'}</td>
            </tr>
        `).join('');
    }
}

// --- Attendance ---
let currentClassId = null;
async function loadAttendancePage() {
    renderSidebar();
    const classes = await fetchAPI('/classes');
    const select = document.getElementById('classSelect');
    if (classes && select) {
        select.innerHTML = '<option value="">Select a Class Session...</option>' + classes.map(c => `
            <option value="${c.class_id}">${c.subject_name} (${new Date(c.class_date).toLocaleDateString()}) - ${c.time_slot}</option>
        `).join('');
        
        select.addEventListener('change', async (e) => {
            currentClassId = e.target.value;
            if(currentClassId) {
                loadStudentsForClass(currentClassId);
            } else {
                document.getElementById('attendance-grid').innerHTML = '';
                document.getElementById('submitBtn').style.display = 'none';
            }
        });
    }
}

async function loadStudentsForClass(classId) {
    const students = await fetchAPI(`/classes/${classId}/students`);
    const grid = document.getElementById('attendance-grid');
    if (students && grid) {
        grid.innerHTML = students.map(s => `
            <tr>
                <td>${s.student_id}</td>
                <td><strong>${s.name}</strong></td>
                <td>
                    <select class="status-select" data-enroll="${s.enroll_id}" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </td>
            </tr>
        `).join('');
        document.getElementById('submitBtn').style.display = 'block';
    } else if (grid) {
        grid.innerHTML = '<tr><td colspan="3">No students found for this class.</td></tr>';
    }
}

async function markAttendance(e) {
    if(e) e.preventDefault();
    const selects = document.querySelectorAll('.status-select');
    const records = Array.from(selects).map(s => ({
        enroll_id: parseInt(s.dataset.enroll),
        status: s.value
    }));
    
    if (records.length === 0) return;
    
    const res = await fetchAPI(`/attendance`, { 
        method: 'POST', 
        body: JSON.stringify({ class_id: parseInt(currentClassId), records }) 
    });
    
    if (res && res.success) {
        alert('Attendance marked correctly for class #' + currentClassId);
        // Clear grid
        document.getElementById('attendance-grid').innerHTML = '';
        document.getElementById('classSelect').value = '';
        document.getElementById('submitBtn').style.display = 'none';
        currentClassId = null;
    }
}

// --- Reports ---
async function loadReports() {
    renderSidebar();
    const reports = await fetchAPI('/attendance/summary');
    const tbody = document.getElementById('reports-body');
    if (reports && tbody) {
        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${r.student_name}</strong></td>
                <td>${r.subject_name}</td>
                <td>${r.total_classes}</td>
                <td>${r.classes_present}</td>
                <td>
                    <span style="font-weight: bold; padding: 4px 8px; border-radius: 20px; color: white; background-color: ${r.percentage >= 80 ? 'var(--success, #10b981)' : (r.percentage > 60 ? 'var(--warning, #f59e0b)' : 'var(--danger, #ef4444)')}">
                        ${parseFloat(r.percentage).toFixed(1)}%
                    </span>
                </td>
            </tr>
        `).join('');
    }
}

// --- Defaulters ---
async function loadDefaulters() {
    renderSidebar();
    const defaulters = await fetchAPI('/defaulters');
    const tbody = document.getElementById('defaulters-body');
    if (defaulters && tbody) {
        tbody.innerHTML = defaulters.map(d => `
            <tr>
                <td>${d.student_id}</td>
                <td><strong>${d.student_name}</strong></td>
                <td style="color: var(--danger, #ef4444); font-weight: bold;">
                    ${parseFloat(d.percentage).toFixed(1)}%
                </td>
                <td>${d.alert_message}</td>
            </tr>
        `).join('');
    }
}

// --- MODAL HANDLERS ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}