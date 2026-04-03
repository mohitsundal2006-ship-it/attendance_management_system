const API_BASE = 'http://localhost:5000/api';

// --- Generic Fetch Config ---
async function fetchAPI(endpoint, options = {}) {
    try {
        const role = localStorage.getItem('user_role');
        const userId = localStorage.getItem('user_id');
        let finalEndpoint = endpoint;
        
        if (role && userId) {
            const separator = endpoint.includes('?') ? '&' : '?';
            finalEndpoint = `${endpoint}${separator}role=${role}&user_id=${userId}`;
        }
        
        const res = await fetch(`${API_BASE}${finalEndpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            ...options
        });
        if (!res.ok) {
            const result = await res.json().catch(() => ({}));
            throw new Error(result.error || result.message || await res.text() || 'Failed response');
        }
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        alert('API Error: ' + err.message);
        return null;
    }
}

// Dynamically create the sidebar navigation for all pages
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const role = localStorage.getItem('user_role');
        const userId = localStorage.getItem('user_id');
        
        if (!role || !userId) {
            window.location.href = 'index.html'; // Ensure auth gate is strict
            return;
        }

        let navLinks = '';
        if (role === 'student') {
            navLinks = `
                <a href="dashboard.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Dashboard
                </a>
                <a href="subjects.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    My Subjects
                </a>
                <a href="reports.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    My Attendance
                </a>
            `;
        } else if (role === 'faculty') {
            navLinks = `
                <a href="dashboard.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Dashboard
                </a>
                <a href="attendance.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    Mark Attendance
                </a>
                <a href="students.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    My Students
                </a>
                <a href="defaulters.html">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Defaulters
                </a>
            `;
        }

        sidebar.innerHTML = `
            <div style="color: var(--text-primary); font-weight: 700; font-size: 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; padding-left: 3.5rem;">
                <div style="display:flex; flex-wrap: wrap; width: 24px; gap: 4px;">
                    <div style="width: 10px; height: 10px; background: var(--accent); border-radius: 5px 5px 0 5px;"></div>
                    <div style="width: 10px; height: 10px; background: #fc8181; border-radius: 5px;"></div>
                    <div style="width: 10px; height: 10px; background: #68d391; border-radius: 5px;"></div>
                    <div style="width: 10px; height: 10px; background: var(--accent); border-radius: 0 5px 5px 5px;"></div>
                </div>
                Attend
            </div>
            <nav style="display: flex; flex-direction: column; gap: 8px;">
                ${navLinks}
            </nav>
            <div style="margin-top: auto; border: 1px solid #f1f3f6; border-radius: 16px; padding: 1.5rem; text-align: center;">
                <div style="margin-bottom: 1rem; color: var(--text-primary); font-weight: 600; font-size: 0.95rem;">Need help?</div>
                <div style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.75rem;">Do you have any problems while using Attend?</div>
                <a href="help.html" class="btn btn-primary" style="display: block; width: 100%; border-radius: 12px; padding: 10px; font-size: 0.85rem; text-decoration: none; margin-bottom: 8px;">
                    Get Help
                </a>
                <a href="index.html" onclick="localStorage.clear()" class="btn" style="display: block; width: 100%; border-radius: 12px; padding: 10px; font-size: 0.85rem; text-decoration: none; background: #f8fafc; color: var(--text-secondary);">
                    Logout
                </a>
            </div>
        `;

        // Inject Hamburger toggle button
        if (!document.getElementById('mobile-menu-btn')) {
            const btn = document.createElement('button');
            btn.id = 'mobile-menu-btn';
            btn.className = 'hamburger-btn';
            btn.innerHTML = '<span></span><span></span><span></span>';
            btn.setAttribute('aria-label', 'Toggle sidebar');
            btn.onclick = (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                const mainContent = document.querySelector('.main-content');
                if (mainContent) mainContent.classList.toggle('sidebar-active');
            };
            document.body.appendChild(btn);

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !btn.contains(e.target) && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    const mainContent = document.querySelector('.main-content');
                    if (mainContent) mainContent.classList.remove('sidebar-active');
                }
            });
        }
    }
}

// --- Dashboard ---
async function loadDashboard() {
    renderSidebar();
    
    // Set Header Info
    const userName = localStorage.getItem('user_name') || 'User';
    const role = localStorage.getItem('user_role');
    const nameEl = document.getElementById('user-display-name');
    const avatarEl = document.getElementById('user-avatar-initial');
    if (nameEl) nameEl.innerText = userName;
    if (avatarEl) avatarEl.innerText = userName.charAt(0).toUpperCase();

    const statsContainer = document.getElementById('stats-container');
    const chartTitle = document.getElementById('chart-title');
    
    const data = await fetchAPI('/dashboard');
    
    if (role === 'student') {
        const subjCount = data ? data.subjects : 0;
        const attPct = data ? Number(data.attendance || 0).toFixed(1) : 0;
        
        let totalConducted = 0;
        let totalMissed = 0;
        
        const sumData = await fetchAPI('/attendance/summary');
        if (sumData && sumData.length > 0) {
            sumData.forEach(d => {
                totalConducted += Number(d.total_classes);
                totalMissed += (Number(d.total_classes) - Number(d.classes_present));
            });
        }
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <article class="glass-panel stat-card" onclick="window.location.href='subjects.html'" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">My Enrolled Subjects</span>
                    <span class="stat-value" style="color: var(--accent);">${subjCount}</span>
                </article>
                <article class="glass-panel stat-card" onclick="window.location.href='reports.html'" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Overall Attendance</span>
                    <span class="stat-value" style="color: ${attPct >= 75 ? 'var(--success)' : 'var(--danger)'};">${attPct}%</span>
                </article>
                <article class="glass-panel stat-card" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Total Classes Conducted</span>
                    <span class="stat-value">${totalConducted}</span>
                </article>
                <article class="glass-panel stat-card" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Classes Missed</span>
                    <span class="stat-value" style="color: ${totalMissed > 0 ? '#ef4444' : '#10b981'};">${totalMissed}</span>
                </article>
            `;
            statsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
        }
        
        if (chartTitle) chartTitle.innerText = "My Attendance per Subject";
        
        if (sumData && sumData.length > 0) {
            const labels = sumData.map(d => d.subject_name.length > 15 ? d.subject_name.substring(0,15) + '...' : d.subject_name);
            const dataValues = sumData.map(d => Number(d.percentage));
            
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            if(window.myChart) { window.myChart.destroy(); }
            window.myChart = new Chart(ctx, {
                type: 'polarArea',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Attendance %',
                        data: dataValues,
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.7)',
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(245, 158, 11, 0.7)',
                            'rgba(239, 68, 68, 0.7)',
                            'rgba(139, 92, 246, 0.7)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } },
                    animation: { animateScale: true, animateRotate: true }
                }
            });
        }
    } else if (role === 'faculty') {
        const studentCount = data ? data.students : 0;
        const classCount = data ? data.classes : 0;
        
        const sumData = await fetchAPI('/attendance/summary');
        
        let excellent = 0;
        let average = 0;
        let poor = 0;
        let totalPerc = 0;
        let avgAtt = 0;
        
        if (sumData && sumData.length > 0) {
            sumData.forEach(d => {
                const p = Number(d.percentage);
                totalPerc += p;
                if (p >= 80) excellent++;
                else if (p >= 60) average++;
                else poor++;
            });
            avgAtt = (totalPerc / sumData.length).toFixed(1);
        }
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <article class="glass-panel stat-card" onclick="window.location.href='students.html'" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Total Students</span>
                    <span class="stat-value" style="color: var(--accent);">${studentCount}</span>
                </article>
                <article class="glass-panel stat-card" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Total Classes Conducted</span>
                    <span class="stat-value">${classCount}</span>
                </article>
                <article class="glass-panel stat-card" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Average Class Attendance</span>
                    <span class="stat-value" style="color: ${avgAtt >= 75 ? 'var(--success)' : 'var(--danger)'};">${avgAtt}%</span>
                </article>
                <article class="glass-panel stat-card" onclick="window.location.href='defaulters.html'" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span class="stat-title">Defaulters Risk Count</span>
                    <span class="stat-value" style="color: ${poor > 0 ? '#ef4444' : '#10b981'};">${poor}</span>
                </article>
            `;
            statsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
        }

        if (chartTitle) chartTitle.innerText = "Students Attendance Health";
        
        if (sumData && sumData.length > 0) {
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            if(window.myChart) { window.myChart.destroy(); }
            window.myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Excellent (>80%)', 'Average (60-80%)', 'Defaulters (<60%)'],
                    datasets: [{
                        data: [excellent, average, poor],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    animation: { animateScale: true }
                }
            });

            const topCont = document.getElementById('top-chart-container');
            const defCont = document.getElementById('defaulter-chart-container');
            if (topCont) topCont.style.display = 'block';
            if (defCont) defCont.style.display = 'block';

            const sortedData = [...sumData].sort((a,b) => b.percentage - a.percentage);
            const top5 = sortedData.slice(0, 5);
            const defaultersList = [...sumData].filter(d => d.percentage < 60).sort((a,b) => a.percentage - b.percentage).slice(0, 5);

            if (document.getElementById('topChart')) {
                const topCtx = document.getElementById('topChart').getContext('2d');
                if(window.topChartInst) { window.topChartInst.destroy(); }
                window.topChartInst = new Chart(topCtx, {
                    type: 'bar',
                    data: {
                        labels: top5.map(d => d.student_name.length > 12 ? d.student_name.substring(0,12)+'...' : d.student_name),
                        datasets: [{
                            label: 'Attendance %',
                            data: top5.map(d => d.percentage),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, max: 100 } },
                        animation: { animateScale: true }
                    }
                });
            }

            if (document.getElementById('defaulterChart')) {
                const defCtx = document.getElementById('defaulterChart').getContext('2d');
                if(window.defChartInst) { window.defChartInst.destroy(); }
                window.defChartInst = new Chart(defCtx, {
                    type: 'bar',
                    data: {
                        labels: defaultersList.length ? defaultersList.map(d => d.student_name.length > 12 ? d.student_name.substring(0,12)+'...' : d.student_name) : ['None'],
                        datasets: [{
                            label: 'Attendance %',
                            data: defaultersList.length ? defaultersList.map(d => d.percentage) : [0],
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, max: 100 } },
                        animation: { animateScale: true }
                    }
                });
            }
        }
    }
}

// --- Students ---
async function loadStudents() {
    renderSidebar();

    // Fetch students table
    const students = await fetchAPI('/students');
    const tbody = document.getElementById('students-body');
    const role = localStorage.getItem('user_role');
    const isFaculty = role === 'faculty';

    if (isFaculty) {
        const thSubjects = document.getElementById('students-th-subjects');
        const thActions = document.getElementById('students-th-actions');
        if (thSubjects) thSubjects.style.display = 'table-cell';
        if (thActions) thActions.style.display = 'none';
        
        const addBtn = document.querySelector('.actions-row button');
        if (addBtn) addBtn.style.display = 'none';
    }

    if (students && tbody) {
        const colCount = isFaculty ? "5" : "5";
        if (students.length === 0) tbody.innerHTML = `<tr><td colspan="${colCount}">No students found</td></tr>`;
        else {
            tbody.innerHTML = students.map(s => `
                <tr>
                    <td>${s.student_id}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>Year ${s.year} - Sec ${s.section}</td>
                    <td>${s.department_name || ''}</td>
                    ${isFaculty ? `<td><span style="font-size: 0.85em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: var(--text-primary);">${s.subjects_taught || ''}</span></td>` : ''}
                    ${isFaculty ? '' : `
                    <td>
                        <button class="btn btn-sm" style="background-color: var(--danger, #ef4444); color: white;" onclick="deleteStudent(${s.student_id})">
                            Delete
                        </button>
                    </td>`}
                </tr>
            `).join('');
        }
    }

    // Fetch departments for the add form select dropdown
    const depts = await fetchAPI('/departments');
    const select = document.getElementById('deptSelect');
    if (depts && select) {
        select.innerHTML = depts.map(d => `<option value="${d.department_id}">${d.department_name}</option>`).join('');
    }

    // Fetch subjects for the add form select dropdown
    const subjs = await fetchAPI('/subjects');
    const subjectSelect = document.getElementById('subjectSelect');
    if (subjs && subjectSelect) {
        subjectSelect.innerHTML = subjs.map(s => `<option value="${s.subject_id}" data-dept="${s.department_id}">${s.subject_name}</option>`).join('');
    }
}

async function addStudent(e) {
    e.preventDefault();
    const deptSelect = document.getElementById('deptSelect');
    const selectedDeptId = deptSelect.value;
    const selectedDeptName = deptSelect.options[deptSelect.selectedIndex]?.text || '';

    const subjectSelect = document.getElementById('subjectSelect');
    const selectedOptions = Array.from(subjectSelect.selectedOptions);
    const subject_ids = selectedOptions.map(opt => opt.value);

    // Validate selected subjects belong to selected department
    const invalidSubjects = selectedOptions.filter(opt => opt.dataset.dept !== selectedDeptId);
    
    if (invalidSubjects.length > 0) {
        const validSubjects = Array.from(subjectSelect.options)
            .filter(opt => opt.dataset.dept === selectedDeptId)
            .map(opt => opt.text);
            
        const validSubjectsText = validSubjects.length > 0 ? validSubjects.join(' and ') : 'no subjects';
        alert(`${selectedDeptName} students can enroll only in ${validSubjectsText}`);
        return;
    }

    const payload = {
        name: document.getElementById('sName').value,
        year: document.getElementById('sYear').value,
        section: document.getElementById('sSection').value,
        department_id: selectedDeptId,
        subject_ids: subject_ids
    };
    const res = await fetchAPI('/students', { method: 'POST', body: JSON.stringify(payload) });
    if (res && res.success) {
        closeModal('addModal');
        document.getElementById('addStudentForm').reset();
        loadStudents();
    }
}

async function deleteStudent(id) {
    if (confirm('Are you certain you wish to delete this student and all their academic records?')) {
        const res = await fetchAPI(`/students/${id}`, { method: 'DELETE' });
        if (res && res.success) {
            loadStudents();
        } else {
            alert("Failed to delete.");
        }
    }
}

// --- Faculty ---
async function loadFaculty() {
    renderSidebar();
    const [faculty, subjects] = await Promise.all([
        fetchAPI('/faculty'),
        fetchAPI('/subjects')
    ]);
    const tbody = document.getElementById('faculty-body');
    if (faculty && subjects && tbody) {
        tbody.innerHTML = faculty.length === 0 ? "<tr><td colspan='4'>No faculty found</td></tr>" : faculty.map(f => {
            const teaches = subjects
                .filter(s => s.faculty_name === f.name)
                .map(s => "<span style='background: var(--bg-primary); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; margin-right: 6px; display: inline-block; margin-bottom: 4px; border: 1px solid var(--panel-border); color: var(--text-primary); font-weight: 500;'>" + s.subject_name + "</span>")
                .join('');

            return "<tr>" +
                "<td>" + f.faculty_id + "</td>" +
                "<td><strong>" + f.name + "</strong></td>" +
                "<td>" + (f.department_name || '') + "</td>" +
                "<td>" + (teaches || "<span style='color: var(--text-secondary); font-style: italic; font-size: 0.85rem;'>No subjects assigned</span>") + "</td>" +
                "</tr>";
        }).join('');
    }
}

// --- Subjects ---
async function loadSubjects() {
    renderSidebar();
    const subjects = await fetchAPI('/subjects');
    const tbody = document.getElementById('subjects-body');
    const role = localStorage.getItem('user_role');
    const isFaculty = role === 'faculty';

    if (isFaculty) {
        const thFaculty = document.getElementById('subjects-th-faculty');
        if (thFaculty) thFaculty.style.display = 'none';
    }

    if (subjects && tbody) {
        const colCount = isFaculty ? "3" : "4";
        tbody.innerHTML = subjects.length === 0 ? `<tr><td colspan="${colCount}">No subjects found</td></tr>` : subjects.map(s => `
            <tr>
                <td>${s.subject_id}</td>
                <td><strong>${s.subject_name}</strong></td>
                ${isFaculty ? '' : `<td>${s.faculty_name || 'Unassigned'}</td>`}
                <td>${s.department_name || ''}</td>
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
            if (currentClassId) {
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
    if (e) e.preventDefault();
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

    const urlParams = new URLSearchParams(window.location.search);
    const deptFilter = urlParams.get('dept');
    const subjFilter = urlParams.get('subject');

    const [reports, students] = await Promise.all([
        fetchAPI('/attendance/summary'),
        deptFilter ? fetchAPI('/students') : Promise.resolve(null)
    ]);

    // Change page title if filtering
    if (deptFilter) {
        const titleEl = document.querySelector('.page-title');
        if (titleEl) titleEl.innerText = deptFilter + ' - Attendance Reports';
    } else if (subjFilter) {
        const titleEl = document.querySelector('.page-title');
        if (titleEl) titleEl.innerText = subjFilter + ' - Attendance Reports';
    }

    const tbody = document.getElementById('reports-body');
    if (reports && tbody) {
        let displayReports = reports;

        if (deptFilter && students) {
            // Find all students in this exact department
            const eligibleStudents = new Set(students.filter(s => s.department_name === deptFilter).map(s => s.name));
            displayReports = displayReports.filter(r => eligibleStudents.has(r.student_name));
        } else if (subjFilter) {
            // Find all reports specific strictly to this subject
            displayReports = displayReports.filter(r => r.subject_name === subjFilter);
        }

        let currentSortCol = '';
        let sortAsc = true;

        const role = localStorage.getItem('user_role');
        const isStudent = role === 'student';

        if (isStudent) {
            const thName = document.getElementById('reports-th-name');
            if (thName) thName.style.display = 'none';
        }

        const renderTable = () => {
            const spanCount = isStudent ? '4' : '5';
            tbody.innerHTML = displayReports.length === 0 ? "<tr><td colspan='" + spanCount + "'>No reports found.</td></tr>" : displayReports.map(r => {
                const percentage = parseFloat(r.percentage);
                const color = percentage >= 80 ? 'var(--success, #10b981)' : (percentage > 60 ? 'var(--warning, #f59e0b)' : 'var(--danger, #ef4444)');
                const nameCol = isStudent ? '' : "<td><strong>" + r.student_name + "</strong></td>";
                return "<tr>" +
                    nameCol +
                    "<td>" + r.subject_name + "</td>" +
                    "<td>" + r.total_classes + "</td>" +
                    "<td>" + r.classes_present + "</td>" +
                    "<td>" +
                    "<span style='font-weight: bold; padding: 4px 8px; border-radius: 20px; color: white; background-color: " + color + "'>" +
                    percentage.toFixed(1) + "%" +
                    "</span>" +
                    "</td>" +
                    "</tr>";
            }).join('');
        };

        // Render table initially
        renderTable();

        // Dynamically inject Sort Functionality into headers
        const thead = tbody.parentElement.querySelector('thead');
        if (thead) {
            const headers = thead.querySelectorAll('th');
            const sortKeys = ['student_name', 'subject_name', 'total_classes', 'classes_present', 'percentage'];

            headers.forEach((th, index) => {
                th.style.cursor = 'pointer';
                th.style.userSelect = 'none';
                th.title = 'Click to sort column';

                // Allow CSS hover styling via JS specifically inline
                th.onmouseenter = function () { this.style.color = 'var(--accent)'; };
                th.onmouseleave = function () { this.style.color = ''; };

                th.onclick = () => {
                    const key = sortKeys[index];

                    if (currentSortCol === key) {
                        sortAsc = !sortAsc; // Toggle sort direction
                    } else {
                        currentSortCol = key;
                        sortAsc = true;     // Default resolving to Ascending on new column
                    }

                    displayReports.sort((a, b) => {
                        let valA = a[key] !== null && a[key] !== undefined ? a[key] : '';
                        let valB = b[key] !== null && b[key] !== undefined ? b[key] : '';

                        // Handle strict numeric values specifically
                        if (['total_classes', 'classes_present', 'percentage'].includes(key)) {
                            valA = parseFloat(valA) || 0;
                            valB = parseFloat(valB) || 0;
                        } else {
                            valA = valA.toString().toLowerCase();
                            valB = valB.toString().toLowerCase();
                        }

                        if (valA < valB) return sortAsc ? -1 : 1;
                        if (valA > valB) return sortAsc ? 1 : -1;
                        return 0;
                    });

                    // Visually update the header with arrows perfectly indicating sort direction
                    headers.forEach(h => h.innerHTML = h.innerHTML.replace(' ↑', '').replace(' ↓', ''));
                    th.innerHTML += sortAsc ? ' ↑' : ' ↓';

                    renderTable();
                };
            });
        }
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