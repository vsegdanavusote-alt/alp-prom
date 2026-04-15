// Supabase
              const SUPABASE_URL = 'https://kdcjxlzgkyigizybtxae.supabase.co';
              const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkY2p4bHpna3lpZ2l6eWJ0eGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjMwOTAsImV4cCI6MjA5MTY5OTA5MH0.2ZawExUzAh6mi-AQCxz9IPn4lOeMt1FLcDLYvEvzcUw';
              const { createClient } = supabase;
              const db = createClient(SUPABASE_URL, SUPABASE_KEY);

              let currentManager = null;

              // Drawer
              function openDrawer(){document.getElementById('drawer').classList.add('on');document.getElementById('overlay').classList.add('on');document.body.style.overflow='hidden';}
              function closeDrawer(){document.getElementById('drawer').classList.remove('on');document.getElementById('overlay').classList.remove('on');document.body.style.overflow='';}
              document.getElementById('burgerBtn').onclick = openDrawer;
              document.getElementById('closeDrawerBtn').onclick = closeDrawer;
              document.getElementById('overlay').onclick = function(){closeDrawer();closeContacts();closeManagerModal();};
              document.getElementById('managerMenuBtn').onclick = function(e){e.preventDefault(); closeDrawer(); openManagerModal();};

              // Contacts drawer
              function openContacts(){document.getElementById('contactsDrawer').classList.add('on');document.getElementById('overlay').classList.add('on');document.body.style.overflow='hidden';}
              function closeContacts(){document.getElementById('contactsDrawer').classList.remove('on');document.getElementById('overlay').classList.remove('on');document.body.style.overflow='';}

              // Manager modal
              function openManagerModal(){document.getElementById('managerModal').classList.add('on');document.getElementById('overlay').classList.add('on');}
              function closeManagerModal(){document.getElementById('managerModal').classList.remove('on');document.getElementById('overlay').classList.remove('on');showLoginForm();}

              function showLoginForm(){document.getElementById('authForms').style.display='block';document.getElementById('registerForms').style.display='none';document.getElementById('modalTitle').innerText='Вход для менеджеров';}
              function showRegisterForm(){document.getElementById('authForms').style.display='none';document.getElementById('registerForms').style.display='block';document.getElementById('modalTitle').innerText='Регистрация менеджера';}

              function generateId(name){
                let initials = name.trim().split(/\s+/).map(p=>p[0].toUpperCase()).join('');
                let rand = Math.floor(1000+Math.random()*9000);
                return `ALP-${initials}-${rand}`;
              }

              async function managerRegister(){
                let name = document.getElementById('regName').value.trim();
                let phone = document.getElementById('regPhone').value.trim();
                let statusDiv = document.getElementById('authStatus');
                if(name.length<3 || phone.length<6){statusDiv.textContent='Заполните имя и телефон';statusDiv.className='status-msg error';return;}
                let managerId = generateId(name);
                let {error} = await db.from('managers').insert([{manager_id:managerId, name:name, phone:phone, registered_at:new Date().toISOString(), status:'active'}]);
                if(error && error.code!='23505'){statusDiv.textContent='Ошибка: '+error.message;statusDiv.className='status-msg error';return;}
                statusDiv.textContent='✅ Регистрация успешна! Ваш ID: '+managerId+'. Сохраните его!';statusDiv.className='status-msg success';
                setTimeout(()=>{showLoginForm();statusDiv.className='status-msg';},3000);
              }

              async function managerLogin(){
                let id = document.getElementById('loginId').value.trim().toUpperCase();
                let phone = document.getElementById('loginPhone').value.trim();
                let statusDiv = document.getElementById('authStatus');
                if(!id || !phone){statusDiv.textContent='Введите ID и телефон';statusDiv.className='status-msg error';return;}
                let {data,error}=await db.from('managers').select('*').eq('manager_id',id).eq('phone',phone);
                if(error || !data || data.length===0){statusDiv.textContent='Неверный ID или телефон';statusDiv.className='status-msg error';return;}
                currentManager = data[0];
                localStorage.setItem('manager',JSON.stringify(currentManager));
                closeManagerModal();
                showAdminPanel();
              }

              function showAdminPanel(){
                document.getElementById('adminPanel').classList.add('on');
                document.getElementById('panelManagerId').innerText=currentManager.manager_id;
                document.getElementById('panelManagerName').innerText=currentManager.name;
                document.getElementById('panelManagerPhone').innerText=currentManager.phone;
                loadMyDeals();
              }

              function managerLogout(){
                currentManager=null;
                localStorage.removeItem('manager');
                document.getElementById('adminPanel').classList.remove('on');
              }

              async function submitDeal(){
                if(!currentManager){alert('Сначала войдите');return;}
                let clientName = document.getElementById('dealClientName').value.trim();
                let clientPhone = document.getElementById('dealClientPhone').value.trim();
                let notes = document.getElementById('dealNotes').value.trim();
                let statusDiv = document.getElementById('dealStatus');
                if(!clientName || !clientPhone){statusDiv.textContent='Заполните имя и телефон клиента';statusDiv.className='status-msg error';return;}
                let {error} = await db.from('deals').insert([{manager_id:currentManager.manager_id, manager_name:currentManager.name, client_name:clientName, client_phone:clientPhone, notes:notes||null, status:'new', created_at:new Date().toISOString()}]);
                if(error){statusDiv.textContent='Ошибка: '+error.message;statusDiv.className='status-msg error';return;}
                statusDiv.textContent='✅ Отчёт отправлен! После подтверждения сделки вы получите 1500 грн';statusDiv.className='status-msg success';
                document.getElementById('dealClientName').value='';
                document.getElementById('dealClientPhone').value='';
                document.getElementById('dealNotes').value='';
                loadMyDeals();
                setTimeout(()=>{statusDiv.className='status-msg';},4000);
              }

              async function loadMyDeals(){
                if(!currentManager)return;
                let container = document.getElementById('myDealsList');
                let {data,error}=await db.from('deals').select('*').eq('manager_id',currentManager.manager_id).order('created_at',{ascending:false});
                if(error){container.innerHTML='<p style="color:var(--mu)">Ошибка загрузки</p>';return;}
                if(!data || data.length===0){container.innerHTML='<p style="color:var(--mu)">Пока нет отправленных сделок</p>';return;}
                let html='';
                data.forEach(d=>{
                  let date = d.created_at ? new Date(d.created_at).toLocaleDateString('ru-RU') : '—';
                  let statusText = d.status==='new' ? '🟡 На проверке' : (d.status==='confirmed' ? '✅ Подтверждена' : '⚪ '+d.status);
                  html+=`<div style="background:var(--bg4);padding:12px;border-radius:8px;margin-bottom:8px"><div><strong>${escapeHtml(d.client_name)}</strong> | ${escapeHtml(d.client_phone)}</div><div style="font-size:12px;color:var(--mu)">${date} | ${statusText}</div><div style="font-size:12px">📝 ${escapeHtml(d.notes||'—')}</div></div>`;
                });
                container.innerHTML=html;
              }

              function escapeHtml(str){if(!str) return ''; return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;});}

              // Steps slider
              let cur=0;
              const track=document.getElementById('stepsTrack'),dotsEl=document.querySelectorAll('#stepDots .dot');
              function goStep(n){cur=n;track.style.transform=`translateX(-${n*100}%)`;dotsEl.forEach((d,i)=>d.classList.toggle('on',i===n));}
              let auto=setInterval(()=>goStep((cur+1)%5),4500);
              let sx=0;
              track.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;clearInterval(auto);},{passive:true});
              track.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-sx;if(dx<-40)goStep(Math.min(cur+1,4));else if(dx>40)goStep(Math.max(cur-1,0));auto=setInterval(()=>goStep((cur+1)%5),4500);});

              // Gallery filter
              function filterG(cat,btn){document.querySelectorAll('.g-tab').forEach(t=>t.classList.remove('on'));btn.classList.add('on');document.querySelectorAll('.g-item').forEach(i=>i.classList.toggle('on',cat==='all'||i.dataset.cat===cat));}

              // FAQ
              document.querySelectorAll('.faq-q').forEach(btn=>{btn.addEventListener('click',()=>{const item=btn.closest('.faq-item'),wasOn=item.classList.contains('on');document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('on'));if(!wasOn)item.classList.add('on');});});

              // Scroll reveal
              const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}})},{threshold:0.07});
              document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

              // Restore session
              let saved = localStorage.getItem('manager');
              if(saved){try{currentManager=JSON.parse(saved);if(currentManager&&currentManager.manager_id)showAdminPanel();else localStorage.removeItem('manager');}catch(e){localStorage.removeItem('manager');}}

/* ═══════════════════════════════════════════
   АЛЬ-ПРОМ / ВСЕГДА НА ВЫСОТЕ — script.js
   ═══════════════════════════════════════════ */

// ── SUPABASE CONFIG ──────────────────────────
const SUPABASE_URL = 'https://kdcjxlzgkyigizybtxae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkY2p4bHpna3lpZ2l6eWJ0eGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjMwOTAsImV4cCI6MjA5MTY5OTA5MH0.2ZawExUzAh6mi-AQCxz9IPn4lOeMt1FLcDLYvEvzcUw';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ────────────────────────────────────
let currentManagerId   = localStorage.getItem('managerId')   || null;
let currentManagerName = localStorage.getItem('managerName') || null;
let pendingPin         = '';     // PIN при регистрации
let enteredPin         = '';     // PIN при входе
let pinMode            = '';     // 'set' | 'login' | 'recover'

// ── HELPERS ──────────────────────────────────
function generateId(name) {
  const initials = name.trim().split(/\s+/).map(p => p[0].toUpperCase()).join('');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VNV-${initials}-${rand}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function setStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById(`step-${i}`).classList.toggle('active', i === n);
    const dot = document.getElementById(`dot-${i}`);
    dot.classList.remove('active', 'done');
    if (i < n) dot.classList.add('done');
    if (i === n) dot.classList.add('active');
  });
}

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${type}`;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Зачекайте...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.orig;
    btn.disabled = false;
  }
}

// ── DEAL STATUS LABEL ─────────────────────────
function dealStatusLabel(status) {
  const map = {
    new:       { text: '🟡 На перевірці',   cls: 'new' },
    confirmed: { text: '✅ Підтверджена',   cls: 'confirmed' },
    paid:      { text: '💰 Виплачено (1500 грн)', cls: 'paid' },
    rejected:  { text: '❌ Відхилена',     cls: 'rejected' },
  };
  return map[status] || { text: '⚪ ' + status, cls: 'new' };
}

// ── TOAST NOTIFICATIONS ──────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4100);
}

// ── STEP 1 → 2 (Name) ────────────────────────
function goStep2() {
  const name = document.getElementById('managerName').value.trim();
  if (name.length < 3) {
    showStatus('name-error', "⚠️ Введіть повне ім'я та прізвище", 'error');
    return;
  }
  const id = generateId(name);
  const date = formatDate();
  currentManagerId   = id;
  currentManagerName = name;

  document.getElementById('display-id').textContent   = id;
  document.getElementById('display-name').textContent = name;
  document.getElementById('display-date').textContent = 'Дата реєстрації: ' + date;
  document.getElementById('step3-id').textContent     = id;
  document.getElementById('report-id-display').textContent = id;

  // Open PIN-set modal
  openPinModal('set');
}

// ── COPY ID ──────────────────────────────────
function copyId() {
  navigator.clipboard.writeText(currentManagerId).then(() => {
    const btn = document.getElementById('btn-copy');
    btn.textContent = '✅ ID скопійовано!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '🏔 СКОПІЮВАТИ МІЙ ID';
      btn.classList.remove('copied');
    }, 2500);
    showToast('ID скопійовано в буфер обміну');
  });
}

// ── STEP 2 → 3 (Save to Supabase) ────────────
async function goStep3() {
  if (!currentManagerId || !currentManagerName) {
    showStatus('step2-status', '⚠️ Будь ласка, поверніться до кроку 1', 'error');
    return;
  }
  setLoading('btn-step2', true);
  try {
    const pin = localStorage.getItem('managerPin') || '';
    const { error } = await db.from('managers').insert([{
      manager_id:    currentManagerId,
      name:          currentManagerName,
      registered_at: new Date().toISOString(),
      status:        'pending',
      pin_hash:      pin   // storing PIN in DB for recovery
    }]);
    if (error && error.code !== '23505') throw error;

    localStorage.setItem('managerId',   currentManagerId);
    localStorage.setItem('managerName', currentManagerName);

    showStatus('step2-status', '✅ Реєстрація успішна!', 'success');
    showToast('Реєстрація успішна! Ласкаво просимо до команди 🏔');
    setTimeout(() => setStep(3), 1000);
  } catch (err) {
    console.error(err);
    showStatus('step2-status', '⚠️ Помилка збереження: ' + err.message, 'error');
  } finally {
    setLoading('btn-step2', false);
  }
}

// ── STEP 3 — Confirm ─────────────────────────
async function confirmAccess() {
  const checks = ['chk1','chk2','chk3','chk4'].map(id => document.getElementById(id).checked);
  if (!checks.every(Boolean)) {
    showStatus('step3-status', '⚠️ Підтвердіть всі пункти', 'error');
    return;
  }
  setLoading('btn-confirm', true);
  try {
    const { error } = await db.from('managers')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('manager_id', currentManagerId);
    if (error) throw error;
    showStatus('step3-status', '✅ Доступ підтверджено!', 'success');
    showToast('Доступ підтверджено! Успішної роботи! 💪');
    document.getElementById('btn-confirm').disabled = true;
  } catch (err) {
    console.error(err);
    showStatus('step3-status', '⚠️ Помилка підтвердження', 'error');
  } finally {
    setLoading('btn-confirm', false);
  }
}

// ── SUBMIT DEAL REPORT ────────────────────────
async function submitReport() {
  const clientName  = document.getElementById('client-name').value.trim();
  const clientPhone = document.getElementById('client-phone').value.trim();
  const notes       = document.getElementById('deal-notes').value.trim();

  if (!clientName || !clientPhone) {
    showStatus('report-status', "⚠️ Заповніть ім'я та телефон замовника", 'error');
    return;
  }
  if (!currentManagerId) {
    showStatus('report-status', '⚠️ Спочатку пройдіть реєстрацію', 'error');
    return;
  }

  setLoading('btn-report', true);
  try {
    const { error } = await db.from('deals').insert([{
      manager_id:   currentManagerId,
      manager_name: currentManagerName,
      client_name:  clientName,
      client_phone: clientPhone,
      notes:        notes || null,
      status:       'new',
      created_at:   new Date().toISOString()
    }]);
    if (error) throw error;

    showStatus('report-status', '✅ Звіт надіслано! Після підписання договору ви отримаєте 1 500 грн.', 'success');
    showToast('Звіт про угоду надіслано! 📨');
    document.getElementById('client-name').value  = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('deal-notes').value   = '';
  } catch (err) {
    console.error(err);
    showStatus('report-status', '⚠️ Помилка надсилання: ' + err.message, 'error');
  } finally {
    setLoading('btn-report', false);
  }
}

// ── LOAD MY DEALS ─────────────────────────────
async function loadMyDeals() {
  if (!currentManagerId) return;
  const listEl = document.getElementById('deals-list');
  if (!listEl) return;

  listEl.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:16px">Завантаження...</p>';

  try {
    const { data, error } = await db
      .from('deals')
      .select('*')
      .eq('manager_id', currentManagerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      listEl.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:16px">Угод ще немає. Починайте роботу! 🚀</p>';
      return;
    }

    listEl.innerHTML = data.map(d => {
      const { text, cls } = dealStatusLabel(d.status);
      const date = new Date(d.created_at).toLocaleDateString('uk-UA');
      return `
        <div class="deal-item">
          <div class="deal-info">
            <div class="deal-client">${d.client_name}</div>
            <div class="deal-meta">${d.client_phone} · ${date}</div>
          </div>
          <span class="deal-status ${cls}">${text}</span>
        </div>`;
    }).join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p style="color:var(--danger);font-size:14px;padding:16px">⚠️ Помилка завантаження угод</p>';
  }
}

// ════════════════════════════════════════════════
// PIN MODAL
// ════════════════════════════════════════════════
function openPinModal(mode) {
  pinMode    = mode;
  enteredPin = '';
  updatePinDots();

  const modal   = document.getElementById('pin-modal');
  const title   = document.getElementById('pin-modal-title');
  const subtitle = document.getElementById('pin-modal-subtitle');

  if (mode === 'set') {
    title.textContent   = 'Створіть PIN-код';
    subtitle.textContent = 'Введіть 4-значний PIN для захисту вашого кабінету';
  } else if (mode === 'login') {
    title.textContent   = 'Вхід до кабінету';
    subtitle.textContent = 'Введіть ваш 4-значний PIN-код';
  } else if (mode === 're