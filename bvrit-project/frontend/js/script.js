document.addEventListener('DOMContentLoaded', function () {

  // ── Auth state ──────────────────────────────────────────────────────────────
  const loggedIn = localStorage.getItem('loggedInUser');
  const userData = loggedIn ? JSON.parse(localStorage.getItem('bvritUserData') || '{}') : null;

  if (loggedIn && userData) {
    document.getElementById('authButtons').style.display  = 'none';
    document.getElementById('userButtons').style.display  = 'flex';
    document.getElementById('welcomeMsg').textContent     = 'Hi, ' + (userData.name || loggedIn);
  }

  // ── Swiper: Image ───────────────────────────────────────────────────────────
  new Swiper('.mySwiper', {
    loop: true,
    autoplay: { delay: 5000, disableOnInteraction: false },
    pagination: { el: '.mySwiper .swiper-pagination', clickable: true },
    navigation: { nextEl: '.mySwiper .swiper-button-next', prevEl: '.mySwiper .swiper-button-prev' }
  });

  // ── Swiper: Video ───────────────────────────────────────────────────────────
  const videoSwiper = new Swiper('.myVideoSwiper', {
    loop: true, autoplay: false, allowTouchMove: true,
    pagination: { el: '.myVideoSwiper .swiper-pagination', clickable: true },
    navigation: { nextEl: '.myVideoSwiper .swiper-button-next', prevEl: '.myVideoSwiper .swiper-button-prev' }
  });
  videoSwiper.on('slideChangeTransitionEnd', () => {
    document.querySelectorAll('.myVideoSwiper video').forEach(v => { v.pause(); v.currentTime=0; });
    const active = document.querySelector('.myVideoSwiper .swiper-slide-active video');
    if (active) active.play().catch(()=>{});
  });

  // ── Modals ──────────────────────────────────────────────────────────────────
  const signupModal     = document.getElementById('signupModal');
  const loginModal      = document.getElementById('loginModal');
  const adminLoginModal = document.getElementById('adminLoginModal');

  document.getElementById('loginBtn').onclick    = e => { e.preventDefault(); loginModal.style.display='block'; };
  document.getElementById('signupBtn').onclick   = e => { e.preventDefault(); signupModal.style.display='block'; };
  document.getElementById('adminLoginBtn').onclick = e => { e.preventDefault(); adminLoginModal.style.display='block'; };
  document.getElementById('closeSignup').onclick = () => signupModal.style.display='none';
  document.getElementById('closeLogin').onclick  = () => loginModal.style.display='none';
  document.getElementById('closeAdminLogin').onclick = () => adminLoginModal.style.display='none';
  window.onclick = e => {
    if (e.target===signupModal) signupModal.style.display='none';
    if (e.target===loginModal)  loginModal.style.display='none';
    if (e.target===adminLoginModal) adminLoginModal.style.display='none';
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = e => {
    e.preventDefault();
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('bvritUserData');
    window.location.reload();
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  function isValidUsername(u) { return /^[a-zA-Z_]+$/.test(u) && (u.match(/_/g)||[]).length===1; }
  function isValidPassword(p) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*_).{8,}$/.test(p); }

  // ── Signup ──────────────────────────────────────────────────────────────────
  document.getElementById('signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('signupError');
    const sucEl = document.getElementById('signupSuccess');
    errEl.textContent = ''; sucEl.textContent = '';

    const name       = document.getElementById('signupFullName').value.trim();
    const department = document.getElementById('signupDept').value;
    const rollNumber = document.getElementById('signupRollNo').value.trim();
    const username   = document.getElementById('signupUsername').value.trim();
    const password   = document.getElementById('signupPassword').value;

    if (!name||!department||!rollNumber||!username||!password) { errEl.textContent='All fields required'; return; }
    if (!isValidUsername(username)) { errEl.textContent='Username: letters only, exactly one underscore, no numbers'; return; }
    if (!isValidPassword(password)) { errEl.textContent='Password: min 8 chars, uppercase, lowercase, number, underscore'; return; }

    try {
      const res  = await fetch(`${API_BASE}/users/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, department, rollNumber, username, password })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error||'Signup failed'; return; }
      sucEl.textContent = 'Signup successful! You can now login.';
      document.getElementById('signupForm').reset();
      setTimeout(() => { signupModal.style.display='none'; sucEl.textContent=''; loginModal.style.display='block'; }, 2000);
    } catch(err) { errEl.textContent='Cannot connect to server. Is the backend running?'; }
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('loginError');
    errEl.textContent='';
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username||!password) { errEl.textContent='Both fields required'; return; }
    try {
      const res  = await fetch(`${API_BASE}/users/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error||'Login failed'; return; }
      localStorage.setItem('loggedInUser', data.user.username);
      localStorage.setItem('bvritUserData', JSON.stringify(data.user));
      loginModal.style.display='none';
      if (data.user.role==='admin') window.location.href='admin-portal.html';
      else window.location.href='user-portal.html';
    } catch(err) { errEl.textContent='Cannot connect to server. Is the backend running?'; }
  });

  // ── Admin Login ─────────────────────────────────────────────────────────────
  document.getElementById('adminLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('adminLoginError');
    errEl.textContent='';
    const username = document.getElementById('adminName').value.trim();
    const password = document.getElementById('adminPass').value;
    try {
      const res  = await fetch(`${API_BASE}/users/admin-login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error||'Invalid admin credentials'; return; }
      localStorage.setItem('loggedInUser', data.user.username);
      localStorage.setItem('bvritUserData', JSON.stringify(data.user));
      window.location.href='admin-portal.html';
    } catch(err) { errEl.textContent='Cannot connect to server'; }
  });

  // ── Event Detail Modal ──────────────────────────────────────────────────────
  const eventDetailModal = document.getElementById('eventDetailModal');

  const eventData = {
    athenes:  { name:'ATHENES',  about:'ATHENES is the most celebrated annual fest of BVRIT Narsapur, bringing together students from different departments in a vibrant celebration of culture, creativity, and technical innovation.\n\nHighlights:\n• Cultural events: dance, music, drama\n• Technical competitions: BAJA, Concrete Canoe\n• Guest talks and entertainment\n• Food stalls and student exhibitions', images:['assets/athenesposter.jpg','assets/athenes1.jpg'], schedule:[{time:'10:00 AM',event:'Registration & Setup'},{time:'12:30 PM',event:'Opening Ceremony'},{time:'1:30 PM',event:'Dance Performances'},{time:'3:00 PM',event:'Lunch Break'},{time:'4:00 PM',event:'Music & Band Performance'},{time:'5:30 PM',event:'Prize Distribution'}], stalls:[{name:'Food Court',description:'Various food vendors'},{name:'Merchandise',description:'College memorabilia'},{name:'Photography Booth',description:'Professional photography'}], guests:[{name:'Dr. P. Ravindra Babu',designation:'Principal, BVRIT'},{name:'Faculty Coordinators',designation:'Event Management'}] },
    avirbhav: { name:'AVIRBHAV', about:'Avirbhav is a creative stage event during ATHENES where students express ideas through drama, skits, and theatrical performances showcasing traditional culture.\n\nHighlights:\n• Traditional attire showcase\n• Cultural dance and music\n• Art exhibitions\n• Teamwork and creativity', images:['assets/avirbhavposter.jpg','assets/traditional1.jpg'], schedule:[{time:'9:00 AM',event:'Gate Opening'},{time:'10:00 AM',event:'Opening Parade'},{time:'11:00 AM',event:'Traditional Performances'},{time:'1:00 PM',event:'Lunch Break'},{time:'2:00 PM',event:'Art Exhibitions'},{time:'4:00 PM',event:'Awards & Closing'}], stalls:[{name:'Traditional Food',description:'Regional cuisines'},{name:'Handicrafts',description:'Traditional art items'},{name:'Clothing',description:'Traditional attire'}], guests:[{name:'Cultural Experts',designation:'Guest Speakers'},{name:'Faculty Members',designation:'Coordinators'}] },
    baja:     { name:'BAJA',     about:'BAJA is one of the most exciting technical events at BVRIT, inspired by the national BAJA SAE competition. Students design and build off-road buggy vehicles.\n\nHighlights:\n• Student-built off-road buggies\n• Live track performance\n• Design, safety & durability judging\n• Engineering innovation showcase', images:['assets/bajaposter.jpg','assets/baja1.jpg','assets/baja2.jpg'], schedule:[{time:'Day 1 8:00 AM',event:'Vehicle Inspection'},{time:'Day 1 2:00 PM',event:'Design Presentation'},{time:'Day 2 6:00 AM',event:'Acceleration Event'},{time:'Day 2 12:00 PM',event:'Endurance Race (4 Hours)'},{time:'Day 3 10:00 AM',event:'Prize Distribution'}], stalls:[{name:'Sponsor Booths',description:'Automotive companies'},{name:'Pit Stop Vendors',description:'Racing supplies'},{name:'Food & Beverage',description:'Refreshments'}], guests:[{name:'SAE India Officials',designation:'Organizers'},{name:'Automotive Experts',designation:'Judges'}] },
    canoe:    { name:'CONCRETE CANOE', about:'The Concrete Canoe Competition challenges students to design and build a canoe using special lightweight concrete, combining creativity with civil engineering.\n\nHighlights:\n• Lightweight concrete canoe design\n• Buoyancy and durability testing\n• On-water racing competition\n• Practical civil engineering skills', images:['assets/canoeposter.jpg','assets/boat.jpg'], schedule:[{time:'8:00 AM',event:'Registration & Safety Briefing'},{time:'9:00 AM',event:'Design Presentation'},{time:'10:30 AM',event:'On-Water Racing Event 1'},{time:'12:30 PM',event:'Lunch Break'},{time:'1:30 PM',event:'On-Water Racing Event 2'},{time:'3:30 PM',event:'Prize Distribution'}], stalls:[{name:'Material Suppliers',description:'Concrete materials'},{name:'Safety Equipment',description:'Life jackets'},{name:'Refreshments',description:'Food and drinks'}], guests:[{name:'Civil Engineering Experts',designation:'Judges'},{name:'Water Safety Officers',designation:'Safety Coordinators'}] },
    autoexpo: { name:'AUTO-EXPO', about:"The Auto Expo is one of ATHENES' most exciting attractions. Students and clubs display modified vehicles, racing bikes, electric vehicles, and custom-built machines.\n\nHighlights:\n• Exhibition of cars, bikes, modified vehicles\n• Drift performances and stunts\n• Automotive technology showcase\n• High-speed racing demonstrations", images:['assets/expoposter.jpg','assets/expo1.jpg','assets/expo2.jpg'], schedule:[{time:'10:00 AM',event:'Vehicle Entry & Setup'},{time:'11:00 AM',event:'Opening Show & Stunts'},{time:'12:00 PM',event:'Drift Performances'},{time:'2:00 PM',event:'Lunch Break'},{time:'3:00 PM',event:'High-Speed Racing'},{time:'4:30 PM',event:'Awards'}], stalls:[{name:'Automotive Dealers',description:'Latest vehicles'},{name:'Accessories Shop',description:'Car accessories'},{name:'Food Festival',description:'Various vendors'},{name:'Photography Booth',description:'Photo sessions'}], guests:[{name:'Professional Stunt Drivers',designation:'Performers'},{name:'Automotive Enthusiasts',designation:'Speakers'}] }
  };

  function openEventDetail(eventId) {
    const ev = eventData[eventId]; if (!ev) return;
    document.querySelector('.event-name-sidebar').textContent = ev.name;
    document.querySelectorAll('.event-title').forEach(el => el.textContent = ev.name);
    document.getElementById('about-content').textContent = ev.about;
    document.getElementById('images-content').innerHTML  = ev.images.map(i=>`<img src="${i}" alt="${ev.name}">`).join('');
    document.getElementById('schedule-content').innerHTML = `<table class="event-schedule-table"><thead><tr><th>Time</th><th>Event</th></tr></thead><tbody>${ev.schedule.map(s=>`<tr><td>${s.time}</td><td>${s.event}</td></tr>`).join('')}</tbody></table>`;
    document.getElementById('stalls-content').innerHTML  = ev.stalls.map(s=>`<div class="stall-item"><h4>${s.name}</h4><p>${s.description}</p></div>`).join('');
    document.getElementById('guests-content').innerHTML  = ev.guests.map(g=>`<div class="guest-item"><h4>${g.name}</h4><p><strong>${g.designation}</strong></p></div>`).join('');

    // Register section
    const loggedIn = localStorage.getItem('loggedInUser');
    document.getElementById('register-content').innerHTML = loggedIn
      ? `<p style="margin-bottom:16px">Click below to register for <strong>${ev.name}</strong>.</p><button class="btn-submit" onclick="registerFromModal('${eventId}','${ev.name}',this)">Register for ${ev.name}</button><p id="regFeedback" style="margin-top:10px;font-weight:600"></p>`
      : `<p>Please <a href="#" onclick="document.getElementById('eventDetailModal').classList.remove('active');document.getElementById('loginModal').style.display='block'">login</a> to register for this event.</p>`;

    // Reset sidebar
    document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
    document.querySelectorAll('.event-section').forEach(s=>s.classList.remove('active'));
    document.querySelector('[data-section="about"]').classList.add('active');
    document.getElementById('section-about').classList.add('active');
    eventDetailModal.classList.add('active');
  }

  window.registerFromModal = async (eventId, name, btn) => {
    btn.disabled=true; btn.textContent='Registering...';
    const fb = document.getElementById('regFeedback');
    try {
      const res  = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method:'POST', headers:{'Content-Type':'application/json','x-username':localStorage.getItem('loggedInUser')}
      });
      const data = await res.json();
      if (res.ok) { fb.style.color='green'; fb.textContent='✅ Registered successfully!'; btn.textContent='Registered'; }
      else { fb.style.color='red'; fb.textContent=data.error||'Registration failed'; btn.disabled=false; btn.textContent=`Register for ${name}`; }
    } catch(e) { fb.style.color='red'; fb.textContent='Server error'; btn.disabled=false; btn.textContent=`Register for ${name}`; }
  };

  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => openEventDetail(card.getAttribute('data-event-id')));
  });
  document.querySelectorAll('.mySwiper .learn-more').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); openEventDetail(link.getAttribute('data-event-id')); });
  });
  document.querySelector('.event-detail-close').addEventListener('click', () => eventDetailModal.classList.remove('active'));
  eventDetailModal.addEventListener('click', e => { if (e.target===eventDetailModal) eventDetailModal.classList.remove('active'); });
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
      document.querySelectorAll('.event-section').forEach(s=>s.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('section-'+item.getAttribute('data-section')).classList.add('active');
    });
  });

});