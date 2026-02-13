document.addEventListener('DOMContentLoaded', () => {
  const roleSelect = document.getElementById('roleSwitch');
  const storedRole = localStorage.getItem('yanRole') || 'public';
  roleSelect.value = storedRole;
  setRole(storedRole);

  roleSelect.addEventListener('change', e => setRole(e.target.value));

  // Spotlight admin
  document.getElementById('addSpot')?.addEventListener('click', addSpotlightEntry);
  renderSpotlight();

  // LMS
  renderModules();
  document.getElementById('submitAssign')?.addEventListener('click', submitAssignment);
  document.getElementById('downloadCert')?.addEventListener('click', downloadCertificate);

  // Application form handling (store data client-side for demo)
  document.getElementById('applicationForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    saveApplication();
  });

  // Profile
  document.getElementById('profileLink')?.addEventListener('click', openProfile);

  // Admin vetting
  document.getElementById('saveVetting')?.addEventListener('click', saveVettingCriteria);
  // Event registrations
  attachRegisterButtons();
  renderMemberDashboard();
});

function setRole(role){
  localStorage.setItem('yanRole', role);
  // show/hide elements based on data-role attributes
  document.querySelectorAll('[data-role]').forEach(el=>{
    const val = el.getAttribute('data-role');
    if(!val) return;
    if(val === 'admin') el.style.display = (role==='admin') ? '' : 'none';
    else if(val === 'member-admin') el.style.display = (role==='member' || role==='admin') ? '' : 'none';
    else el.style.display = '';
  });
}

// Spotlight functions (store in localStorage)
function addSpotlightEntry(){
  const name = document.getElementById('spotName').value.trim();
  const summary = document.getElementById('spotSummary').value.trim();
  const file = document.getElementById('spotImage').files[0];
  if(!name || !summary) return alert('Provide name and summary');
  const entry = {id: Date.now(), name, summary};
  if(file){
    const reader = new FileReader();
    reader.onload = () => {
      entry.image = reader.result;
      saveSpot(entry);
    };
    reader.readAsDataURL(file);
  } else saveSpot(entry);
}
function saveSpot(entry){
  const arr = JSON.parse(localStorage.getItem('spotlightEntries')||'[]');
  arr.push(entry);
  localStorage.setItem('spotlightEntries', JSON.stringify(arr));
  renderSpotlight();
  document.getElementById('spotlightForm').reset();
}
function renderSpotlight(){
  const grid = document.getElementById('spotlightGrid');
  if(!grid) return;
  // remove previously appended dynamic cards
  Array.from(grid.querySelectorAll('.dynamic-spot')).forEach(n=>n.remove());
  const arr = JSON.parse(localStorage.getItem('spotlightEntries')||'[]');
  arr.forEach(entry=>{
    const div = document.createElement('div');
    div.className = 'program-card dynamic-spot';
    div.innerHTML = `<h3>${escapeHtml(entry.name)}</h3><p>${escapeHtml(entry.summary)}</p>` + (entry.image?`<img src="${entry.image}" alt="${escapeHtml(entry.name)}" style="max-width:100%;margin-top:0.5rem">`: '');
    grid.appendChild(div);
  });
}

// Simple LMS: modules stored client-side
function renderModules(){
  const modules = JSON.parse(localStorage.getItem('lmsModules')||JSON.stringify([
    {id:1,title:'Foundations: Leadership & Soft Skills'},
    {id:2,title:'Project Design & M&E'},
    {id:3,title:'Financial Management & Fundraising'}
  ]));
  localStorage.setItem('lmsModules', JSON.stringify(modules));
  const list = document.getElementById('modulesList');
  const sel = document.getElementById('assignModule');
  if(list) list.innerHTML = '';
  if(sel) sel.innerHTML = '';
  modules.forEach(m=>{
    if(list){
      const card = document.createElement('div'); card.className='program-card';
      card.innerHTML = `<h3>${escapeHtml(m.title)}</h3><p>Brief overview available to enrolled members.</p>`;
      list.appendChild(card);
    }
    if(sel) sel.appendChild(new Option(m.title, m.id));
  });
}
function submitAssignment(){
  const file = document.getElementById('assignFile').files[0];
  const moduleId = document.getElementById('assignModule').value;
  if(!file) return alert('Choose a file to submit');
  const reader = new FileReader();
  reader.onload = () => {
    const submissions = JSON.parse(localStorage.getItem('submissions')||'[]');
    submissions.push({id:Date.now(),moduleId, name:file.name, data:reader.result});
    localStorage.setItem('submissions', JSON.stringify(submissions));
    document.getElementById('submissionStatus').innerText = 'Submission saved (demo).';
    document.getElementById('assignFile').value = '';
  };
  reader.readAsDataURL(file);
}
function downloadCertificate(){
  const role = localStorage.getItem('yanRole')||'public';
  if(role==='public') return alert('Only members/admins can download certificates.');
  const blob = new Blob([`Certificate of Completion\nOrganization: Youth Advocates Network\nUser role: ${role}\nDate: ${new Date().toLocaleDateString()}`], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'YAN-certificate.txt'; document.body.appendChild(a); a.click(); a.remove();
}

// Event registration functions
function attachRegisterButtons(){
  document.querySelectorAll('.registerBtn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-event-id');
      const title = btn.closest('.opportunity-card')?.querySelector('h3')?.innerText || 'Event';
      registerForEvent(id, title);
    });
  });
}
function registerForEvent(eventId, title){
  const role = localStorage.getItem('yanRole')||'public';
  if(role==='public') return alert('Only members and admins can register.');
  const regs = JSON.parse(localStorage.getItem('registrations')||'[]');
  regs.push({id:Date.now(), eventId, title, date:new Date().toLocaleDateString(), status:'registered'});
  localStorage.setItem('registrations', JSON.stringify(regs));
  alert('Registered for '+title+' (demo).');
  renderMemberDashboard();
}
function renderMemberDashboard(){
  const tbody = document.querySelector('#registrationsTable tbody');
  if(!tbody) return;
  const regs = JSON.parse(localStorage.getItem('registrations')||'[]');
  tbody.innerHTML = '';
  regs.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.date)}</td><td><span class="status-badge registered">${escapeHtml(r.status)}</span></td><td><button class="btn btn-sm btn-secondary" data-id="${r.id}">Cancel</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-id]').forEach(btn=>btn.addEventListener('click', e=>{
    const id = Number(btn.getAttribute('data-id'));
    let regs = JSON.parse(localStorage.getItem('registrations')||'[]');
    regs = regs.filter(x=>x.id!==id);
    localStorage.setItem('registrations', JSON.stringify(regs));
    renderMemberDashboard();
  }));
}

// Application form saving (demo only)
function saveApplication(){
  const data = {
    name: document.getElementById('appFullName').value,
    email: document.getElementById('appEmail').value,
    phone: document.getElementById('appPhone').value,
    org: document.getElementById('appOrgName').value,
    role: document.getElementById('appRole').value,
    time: new Date().toISOString()
  };
  // read files (optional)
  const refs = [];
  const refFile = document.getElementById('appRefLetter').files[0];
  const regFile = document.getElementById('appRegLetter').files[0];
  const other = document.getElementById('appOtherDocs').files;
  const readers = [];
  function finalSave(){
    const arr = JSON.parse(localStorage.getItem('applications')||'[]');
    arr.push(data);
    localStorage.setItem('applications', JSON.stringify(arr));
    alert('Application saved (demo).');
    document.getElementById('applyModal').style.display='none';
  }
  if(refFile){
    readers.push(new Promise(res=>{const r=new FileReader();r.onload=()=>{data.ref= r.result; res();}; r.readAsDataURL(refFile);}));
  }
  if(regFile){
    readers.push(new Promise(res=>{const r=new FileReader();r.onload=()=>{data.reg= r.result; res();}; r.readAsDataURL(regFile);}));
  }
  if(other && other.length){
    const arrF = [];
    for(let i=0;i<other.length;i++){
      readers.push(new Promise(res=>{const r=new FileReader();r.onload=()=>{arrF.push({name:other[i].name,data:r.result}); res();}; r.readAsDataURL(other[i]);}));
    }
    Promise.all(readers).then(()=>{data.other=arrF; finalSave();});
  } else {
    Promise.all(readers).then(finalSave);
  }
}

// Profile (simple client-side modal)
function openProfile(e){
  e.preventDefault();
  let profile = JSON.parse(localStorage.getItem('yanProfile')||'{}');
  const name = prompt('Full name', profile.name||'');
  if(name==null) return;
  const email = prompt('Email', profile.email||'');
  if(email==null) return;
  profile.name = name; profile.email = email; profile.updated = new Date().toISOString();
  localStorage.setItem('yanProfile', JSON.stringify(profile));
  alert('Profile saved (demo).');
}

// Vetting criteria
function saveVettingCriteria(){
  const text = document.getElementById('vettingText').value;
  const file = document.getElementById('vettingDoc').files[0];
  const obj = {text, time: new Date().toISOString()};
  if(file){
    const r = new FileReader(); r.onload=()=>{ obj.doc = r.result; localStorage.setItem('vetting', JSON.stringify(obj)); alert('Vetting saved (demo).'); };
    r.readAsDataURL(file);
  } else { localStorage.setItem('vetting', JSON.stringify(obj)); alert('Vetting saved (demo).'); }
}

// util
function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }
