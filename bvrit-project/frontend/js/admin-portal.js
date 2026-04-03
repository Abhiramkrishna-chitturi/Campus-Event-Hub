// ─── Admin Portal JS ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('loggedInUser');
  const userStr  = localStorage.getItem('bvritUserData');
  if (!username || !userStr) { window.location.href = 'index.html'; return; }
  const userData = JSON.parse(userStr);
  if (userData.role !== 'admin') { window.location.href = 'index.html'; return; }
  loadStats();
});

function getHeaders() {
  return { 'Content-Type':'application/json', 'x-username': localStorage.getItem('loggedInUser') };
}

function showAlert(msg, type='success') {
  const box = document.getElementById('adminAlert');
  box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

function showSection(id, btn) {
  document.querySelectorAll('.portal-section').forEach(s => s.style.display='none');
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('.portal-menu-item').forEach(m => m.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'events')     loadAllEvents();
  if (id === 'users')      loadAllUsers();
  if (id === 'attendance') loadAttendanceDropdown();
}

async function loadStats() {
  try {
    const res  = await fetch(`${API_BASE}/events/stats`, { headers: getHeaders() });
    const data = await res.json();
    document.getElementById('totalEvents').textContent        = data.totalEvents        || 0;
    document.getElementById('totalUsers').textContent         = data.totalUsers         || 0;
    document.getElementById('totalRegistrations').textContent = data.totalRegistrations || 0;
    document.getElementById('pendingApprovals').textContent   = data.pendingApprovals   || 0;
  } catch(e) { console.error(e); }
}

async function loadAllEvents() {
  const tbody = document.getElementById('eventsTableBody');
  try {
    const res    = await fetch(`${API_BASE}/events/all`, { headers: getHeaders() });
    const events = await res.json();
    if (!events.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">No events yet.</td></tr>'; return; }
    tbody.innerHTML = events.map(ev => `
      <tr>
        <td><strong>${ev.name}</strong><br><small style="color:#999">${ev.eventId}</small></td>
        <td>${ev.date}</td>
        <td>${ev.location}</td>
        <td>${ev.capacity}</td>
        <td>${ev.registrations ? ev.registrations.length : 0}</td>
        <td><span class="badge badge-${ev.status==='active'?'success':'pending'}">${ev.status}</span></td>
        <td>
          <button class="btn-primary" onclick="toggleEventStatus('${ev.eventId}','${ev.status}')" style="padding:5px 10px;font-size:12px">
            ${ev.status==='active'?'Deactivate':'Activate'}
          </button>
          <button class="btn-danger" onclick="deleteEvent('${ev.eventId}')" style="padding:5px 10px;font-size:12px">Delete</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:red;text-align:center">Failed to load events</td></tr>';
  }
}

async function toggleEventStatus(eventId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await fetch(`${API_BASE}/events/${eventId}`, { method:'PUT', headers: getHeaders(), body: JSON.stringify({ status: newStatus }) });
    showAlert('Event status updated');
    loadAllEvents();
  } catch(e) { showAlert('Failed to update', 'error'); }
}

async function deleteEvent(eventId) {
  if (!confirm('Delete this event permanently?')) return;
  try {
    await fetch(`${API_BASE}/events/${eventId}`, { method:'DELETE', headers: getHeaders() });
    showAlert('Event deleted');
    loadAllEvents();
    loadStats();
  } catch(e) { showAlert('Delete failed', 'error'); }
}

async function loadAllUsers() {
  const tbody = document.getElementById('usersTableBody');
  try {
    const res   = await fetch(`${API_BASE}/users/all`, { headers: getHeaders() });
    const users = await res.json();
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">No users yet.</td></tr>'; return; }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.username}</td>
        <td>${u.rollNumber}</td>
        <td>${u.department}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
        <td><span class="badge badge-${u.isActive?'success':'danger'}">${u.isActive?'Active':'Inactive'}</span></td>
        <td>
          <button class="btn-primary btn-${u.isActive?'danger':'success'}" onclick="toggleUser('${u._id}')" style="padding:5px 10px;font-size:12px;background:${u.isActive?'#d32f2f':'#388e3c'}">
            ${u.isActive?'Deactivate':'Activate'}
          </button>
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:red;text-align:center">Failed to load users</td></tr>';
  }
}

async function toggleUser(userId) {
  try {
    await fetch(`${API_BASE}/users/${userId}/toggle`, { method:'PATCH', headers: getHeaders() });
    showAlert('User status updated');
    loadAllUsers();
  } catch(e) { showAlert('Failed', 'error'); }
}

// Create event form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createEventForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = Object.fromEntries(fd.entries());
      // Format date for display
      if (body.date) body.date = new Date(body.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
      if (body.time) {
        const [h,m] = body.time.split(':');
        const hh = parseInt(h); const ampm = hh >= 12 ? 'PM' : 'AM';
        body.time = `${hh===0?12:hh>12?hh-12:hh}:${m} ${ampm}`;
      }
      try {
        const res  = await fetch(`${API_BASE}/events`, { method:'POST', headers: getHeaders(), body: JSON.stringify(body) });
        const data = await res.json();
        if (res.ok) { showAlert('✅ Event created!'); form.reset(); loadStats(); showSection('events',null); }
        else showAlert(data.error || 'Failed to create event', 'error');
      } catch(e) { showAlert('Server error', 'error'); }
    });
  }
});

async function loadAttendanceDropdown() {
  const sel = document.getElementById('attendanceEventSelect');
  try {
    const res    = await fetch(`${API_BASE}/events/all`, { headers: getHeaders() });
    const events = await res.json();
    sel.innerHTML = '<option value="">-- Select Event --</option>' +
      events.map(ev => `<option value="${ev.eventId}">${ev.name}</option>`).join('');
  } catch(e) {}
}

async function loadAttendance(eventId) {
  const tbody = document.getElementById('attendanceTableBody');
  if (!eventId) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">Select an event</td></tr>'; return; }
  try {
    const res  = await fetch(`${API_BASE}/events/${eventId}/registrations`, { headers: getHeaders() });
    const regs = await res.json();
    if (!regs.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">No registrations yet</td></tr>'; return; }
    tbody.innerHTML = regs.map(r => `
      <tr>
        <td>${r.name || (r.user && r.user.name) || '—'}</td>
        <td>${r.rollNumber || (r.user && r.user.rollNumber) || '—'}</td>
        <td>${r.department || (r.user && r.user.department) || '—'}</td>
        <td>${new Date(r.registeredAt).toLocaleDateString('en-IN')}</td>
        <td><span class="badge badge-${r.attended?'success':'pending'}">${r.attended?'Present':'Absent'}</span></td>
        <td>
          ${!r.attended ? `<button class="btn-primary btn-success" onclick="markAttend('${eventId}','${r.user?r.user._id:r._id}',this)" style="padding:5px 10px;font-size:12px;background:#388e3c">Mark Present</button>` : '—'}
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center">Failed to load</td></tr>';
  }
}

async function markAttend(eventId, userId, btn) {
  btn.disabled = true;
  try {
    await fetch(`${API_BASE}/events/${eventId}/attend/${userId}`, { method:'PATCH', headers: getHeaders() });
    showAlert('Attendance marked');
    loadAttendance(eventId);
  } catch(e) { showAlert('Failed', 'error'); btn.disabled = false; }
}

function logout() { localStorage.removeItem('loggedInUser'); localStorage.removeItem('bvritUserData'); window.location.href = 'index.html'; }
function goHome() { window.location.href = 'index.html'; }