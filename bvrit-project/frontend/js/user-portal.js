// ─── User Portal JS ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('loggedInUser');
  const userStr  = localStorage.getItem('bvritUserData');
  if (!username || !userStr) { window.location.href = 'index.html'; return; }

  const userData = JSON.parse(userStr);
  if (userData.role === 'admin') { window.location.href = 'admin-portal.html'; return; }

  // Fill profile info
  document.getElementById('displayName').textContent  = userData.name || username;
  document.getElementById('displayDept').textContent  = userData.department || '';
  document.getElementById('avatarInitial').textContent = (userData.name || username)[0].toUpperCase();
  document.getElementById('profileName').textContent     = userData.name || '';
  document.getElementById('profileUsername').textContent = userData.username || username;
  document.getElementById('profileDept').textContent     = userData.department || '';
  document.getElementById('profileRoll').textContent     = userData.rollNumber || '';
  document.getElementById('profileRole').textContent     = userData.role || 'user';

  loadDashboard();
});

function getHeaders() {
  return { 'Content-Type':'application/json', 'x-username': localStorage.getItem('loggedInUser') };
}

function showAlert(msg, type='success') {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

function showSection(id, btn) {
  document.querySelectorAll('.portal-section').forEach(s => s.style.display='none');
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('.portal-menu-item').forEach(m => m.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('portalTitle').textContent = btn ? btn.textContent.trim() : '';
  if (id === 'events') loadEvents();
  if (id === 'my-registrations') loadMyRegistrations();
}

async function loadDashboard() {
  try {
    const [evRes, myRes] = await Promise.all([
      fetch(`${API_BASE}/api/events`, { headers: getHeaders() }),
      fetch(`${API_BASE}/api/events/user/my-registrations`, { headers: getHeaders() })
    ]);
    const events = await evRes.json();
    const myRegs = await myRes.json();
    document.getElementById('totalAvailable').textContent = Array.isArray(events) ? events.length : 0;
    document.getElementById('myEventCount').textContent   = Array.isArray(myRegs)  ? myRegs.length  : 0;
  } catch(e) { console.error(e); }
}

async function loadEvents() {
  const container = document.getElementById('eventsContainer');
  try {
    const [evRes, myRes] = await Promise.all([
      fetch(`${API_BASE}/api/events`),
      fetch(`${API_BASE}/api/events/user/my-registrations`, { headers: getHeaders() })
    ]);
    const events = await evRes.json();
    const myRegs = await myRes.json();
    const myEventIds = Array.isArray(myRegs) ? myRegs.map(r => r.eventId) : [];

    if (!events.length) { container.innerHTML = '<p style="color:#666">No events available.</p>'; return; }

    container.innerHTML = events.map(ev => {
      const registered = myEventIds.includes(ev.eventId);
      const full = ev.registrations >= ev.capacity;
      return `
        <div class="event-reg-card">
          <div>
            <h3>${ev.name}</h3>
            <p>📅 ${ev.date} &nbsp; ⏰ ${ev.time} &nbsp; 📍 ${ev.location}</p>
            <p>👥 ${ev.registrations || 0}/${ev.capacity} &nbsp; 🏷 ${ev.category}</p>
            <p style="color:#555;font-size:13px;margin-top:6px">${ev.description.substring(0,120)}...</p>
          </div>
          <div style="text-align:center">
            ${registered
              ? '<span class="badge badge-success">✅ Registered</span>'
              : full
                ? '<button class="btn-register" disabled>Full</button>'
                : `<button class="btn-register" onclick="registerEvent('${ev.eventId}','${ev.name}',this)">Register</button>`
            }
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:red">Failed to load events. Is the backend running?</p>';
  }
}

async function registerEvent(eventId, name, btn) {
  btn.disabled = true; btn.textContent = 'Registering...';
  try {
    const res  = await fetch(`${API_BASE}/api/events/${eventId}/register`, { method:'POST', headers: getHeaders() });
    const data = await res.json();
    if (res.ok) {
      showAlert('✅ ' + data.message);
      btn.outerHTML = '<span class="badge badge-success">✅ Registered</span>';
      loadDashboard();
    } else {
      showAlert(data.error || 'Registration failed', 'error');
      btn.disabled = false; btn.textContent = 'Register';
    }
  } catch(e) {
    showAlert('Server error', 'error');
    btn.disabled = false; btn.textContent = 'Register';
  }
}

async function loadMyRegistrations() {
  const container = document.getElementById('myRegsContainer');
  try {
    const res  = await fetch(`${API_BASE}/api/events/user/my-registrations`, { headers: getHeaders() });
    const regs = await res.json();
    if (!res.ok || !regs.length) { container.innerHTML = '<p style="color:#666">You haven\'t registered for any events yet.</p>'; return; }
    container.innerHTML = regs.map(r => `
      <div class="event-reg-card">
        <div>
          <h3>${r.eventName || (r.event && r.event.name) || '—'}</h3>
          <p>📅 ${r.event && r.event.date ? r.event.date : '—'} &nbsp; 📍 ${r.event && r.event.location ? r.event.location : '—'}</p>
          <p>Registered on: ${new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        <span class="badge badge-success">Registered</span>
      </div>`).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:red">Failed to load. Is the backend running?</p>';
  }
}

function logout() { localStorage.removeItem('loggedInUser'); localStorage.removeItem('bvritUserData'); window.location.href = 'index.html'; }
function goHome() { window.location.href = 'index.html'; }