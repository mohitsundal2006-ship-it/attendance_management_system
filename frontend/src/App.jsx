import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, Users, UserCheck, BookOpen, CalendarCheck, FileText, AlertTriangle, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

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
    return null;
  }
}

const Th = ({ children }) => <th style={{ padding: '15px', textAlign: 'left', backgroundColor: '#f1f5f9', color: '#475569' }}>{children}</th>;
const Td = ({ children, style }) => <td style={{ padding: '15px', borderTop: '1px solid #e2e8f0', ...style }}>{children}</td>;

function Sidebar() {
  const location = useLocation();
  const getLinkStyle = (path) => ({
    textDecoration: 'none',
    color: location.pathname === path ? 'white' : '#cbd5e1',
    backgroundColor: location.pathname === path ? '#1e293b' : 'transparent',
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: '8px', transition: '0.2s', marginBottom: '5px'
  });

  return (
    <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0 }}>
      <div style={{ padding: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <GraduationCap size={32} /> Admin
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem', flex: 1 }}>
        <Link to="/" style={getLinkStyle('/')}><LayoutDashboard /> Dashboard</Link>
        <Link to="/students" style={getLinkStyle('/students')}><Users /> Students</Link>
        <Link to="/faculty" style={getLinkStyle('/faculty')}><UserCheck /> Faculty</Link>
        <Link to="/subjects" style={getLinkStyle('/subjects')}><BookOpen /> Subjects</Link>
        <Link to="/attendance" style={getLinkStyle('/attendance')}><CalendarCheck /> Attendance</Link>
        <Link to="/reports" style={getLinkStyle('/reports')}><FileText /> Reports</Link>
        <Link to="/defaulters" style={getLinkStyle('/defaulters')}><AlertTriangle /> Defaulters</Link>
      </nav>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', padding: '40px', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ students: 0, subjects: 0, attendance: 0, defaulters: 0 });
  useEffect(() => { fetchAPI('/dashboard').then(data => data && setStats(data)); }, []);
  const card = { padding: '24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Dashboard Overview</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={card}><h3 style={{ color: '#64748b', margin: 0 }}>Total Students</h3><p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#0f172a' }}>{stats.students}</p></div>
        <div style={card}><h3 style={{ color: '#64748b', margin: 0 }}>Subjects</h3><p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#0f172a' }}>{stats.subjects}</p></div>
        <div style={card}><h3 style={{ color: '#64748b', margin: 0 }}>Avg Attendance</h3><p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#10b981' }}>{parseFloat(stats.attendance).toFixed(1)}%</p></div>
        <div style={card}><h3 style={{ color: '#64748b', margin: 0 }}>Defaulters</h3><p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#ef4444' }}>{stats.defaulters}</p></div>
      </div>
    </div>
  );
}

function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', year: '', section: '', department_id: '' });

  const load = () => fetchAPI('/students').then(data => data && setStudents(data));
  const loadDepts = () => fetchAPI('/departments').then(data => data && setDepartments(data));

  useEffect(() => { load(); loadDepts(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student and their academic records?')) {
      const res = await fetchAPI(`/students/${id}`, { method: 'DELETE' });
      if (res?.success) load();
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await fetchAPI('/students', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    if (res?.success) {
      setIsAdding(false);
      setFormData({ name: '', year: '', section: '', department_id: '' });
      load();
    } else {
      alert("Failed to add student. Please check your inputs.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px' }}>Students Directory</h2>
        <button onClick={() => setIsAdding(!isAdding)} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {isAdding ? 'Cancel' : '+ Add New Student'}
        </button>
      </div>

      {isAdding && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Add New Student</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}><label style={{ fontSize: '14px', marginBottom: '5px' }}>Name</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="e.g. John Doe" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100px' }}><label style={{ fontSize: '14px', marginBottom: '5px' }}>Year</label><input required type="number" min="1" max="4" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="1-4" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100px' }}><label style={{ fontSize: '14px', marginBottom: '5px' }}>Section</label><input required value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="A/B/C" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}><label style={{ fontSize: '14px', marginBottom: '5px' }}>Department</label><select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><option value="">Select Dept...</option>{departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}</select></div>
            <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', height: '40px' }}>Save Student</button>
          </form>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Year & Section</Th><Th>Department</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {students.map(s => (
            <tr key={s.student_id}>
              <Td>{s.student_id}</Td>
              <Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{s.name}</Td>
              <Td>Year {s.year} - Sec {s.section}</Td>
              <Td>{s.department_name}</Td>
              <Td>
                <button onClick={() => handleDelete(s.student_id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                  <Trash2 size={16} /> Delete
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Faculty() {
  const [data, setData] = useState([]);
  useEffect(() => { fetchAPI('/faculty').then(d => d && setData(d)); }, []);
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Faculty Roster</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Department</Th></tr></thead>
        <tbody>{data.map(f => <tr key={f.faculty_id}><Td>{f.faculty_id}</Td><Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{f.name}</Td><Td>{f.department_name}</Td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Subjects() {
  const [data, setData] = useState([]);
  useEffect(() => { fetchAPI('/subjects').then(d => d && setData(d)); }, []);
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Subject List</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead><tr><Th>ID</Th><Th>Subject Name</Th><Th>Assigned Faculty</Th></tr></thead>
        <tbody>{data.map(s => <tr key={s.subject_id}><Td>{s.subject_id}</Td><Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{s.subject_name}</Td><Td>{s.faculty_name || 'Unassigned'}</Td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Attendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => { fetchAPI('/classes').then(d => d && setClasses(d)); }, []);

  const handleClassChange = async (e) => {
    const cid = e.target.value;
    setSelectedClass(cid);
    if (cid) {
      const data = await fetchAPI(`/classes/${cid}/students`);
      setStudents(data || []);
      const initialMap = {};
      data?.forEach(s => initialMap[s.enroll_id] = 'Present');
      setStatusMap(initialMap);
    } else { setStudents([]); }
  };

  const submitAttendance = async () => {
    const records = students.map(s => ({ enroll_id: s.enroll_id, status: statusMap[s.enroll_id] }));
    const res = await fetchAPI('/attendance', { method: 'POST', body: JSON.stringify({ class_id: selectedClass, records }) });
    if (res?.success) { alert('Attendance successfully marked!'); setSelectedClass(''); setStudents([]); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Mark Class Attendance</h2>
      <select value={selectedClass} onChange={handleClassChange} style={{ padding: '15px', fontSize: '16px', width: '100%', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
        <option value="">Select a Class Session...</option>
        {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.subject_name} ({new Date(c.class_date).toLocaleDateString()}) - {c.time_slot}</option>)}
      </select>
      {students.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead><tr><Th>Student ID</Th><Th>Name</Th><Th>Status</Th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id}>
                  <Td>{s.student_id}</Td><Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{s.name}</Td>
                  <Td>
                    <select value={statusMap[s.enroll_id]} onChange={e => setStatusMap({ ...statusMap, [s.enroll_id]: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <option value="Present">Present</option><option value="Absent">Absent</option>
                    </select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={submitAttendance} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Submit Attendance</button>
        </div>
      )}
    </div>
  );
}

function Reports() {
  const [data, setData] = useState([]);
  useEffect(() => { fetchAPI('/attendance/summary').then(d => d && setData(d)); }, []);
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Attendance Reports</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead><tr><Th>Student Name</Th><Th>Subject</Th><Th>Classes Attended</Th><Th>Percentage</Th></tr></thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{r.student_name}</Td><Td>{r.subject_name}</Td><Td>{r.classes_present} / {r.total_classes}</Td>
              <Td>
                <span style={{ padding: '6px 12px', borderRadius: '20px', backgroundColor: r.percentage >= 80 ? '#d1fae5' : r.percentage > 60 ? '#fef3c7' : '#fee2e2', color: r.percentage >= 80 ? '#059669' : r.percentage > 60 ? '#d97706' : '#dc2626', fontWeight: 'bold' }}>
                  {parseFloat(r.percentage).toFixed(1)}%
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Defaulters() {
  const [data, setData] = useState([]);
  useEffect(() => { fetchAPI('/defaulters').then(d => d && setData(d)); }, []);
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '28px' }}>Defaulters Alert List</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead><tr><Th>ID</Th><Th>Student Name</Th><Th>Percentage</Th><Th>Alert Message</Th></tr></thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <Td>{d.student_id}</Td><Td style={{ fontWeight: 'bold', color: '#0f172a' }}>{d.student_name}</Td>
              <Td style={{ color: '#dc2626', fontWeight: 'bold' }}>{parseFloat(d.percentage).toFixed(1)}%</Td><Td>{d.alert_message}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  // Quick hack to remove browser body margins
  useEffect(() => { document.body.style.margin = "0"; document.body.style.padding = "0"; }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/defaulters" element={<Defaulters />} />
        </Routes>
      </Layout>
    </Router>
  );
}
