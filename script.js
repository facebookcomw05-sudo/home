// ==================== إعدادات Firebase (استبدلها ببياناتك) ====================
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBg9k9ralgHyx6cBTIXcOiHSiE-Nm9ZaA4",
    authDomain: "web-programming-d3561.firebaseapp.com",
    projectId: "web-programming-d3561",
    storageBucket: "web-programming-d3561.firebasestorage.app",
    messagingSenderId: "307497227438",
    appId: "1:307497227438:web:0ee66f2fc924db4582c93f",
    measurementId: "G-4P6HXQJ232"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

// ==================== مساعدة عامة ====================
function showModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// ==================== نموذج المنحة (grant.html) ====================
if (window.location.pathname.includes('grant.html')) {
  const form = document.getElementById('grantForm');
  let collectedData = null;
  form.addEventListener('submit', (e) => { e.preventDefault();
    const data = new FormData(form);
    const obj = {};
    data.forEach((v,k)=> obj[k]=v);
    collectedData = { ...obj, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    showModal('confirmModal1');
  });
  document.getElementById('confirmYes1')?.addEventListener('click', ()=> { hideModal('confirmModal1'); showModal('confirmModal2'); });
  document.getElementById('confirmNo1')?.addEventListener('click', ()=> { hideModal('confirmModal1'); });
  document.getElementById('confirmYes2')?.addEventListener('click', async ()=> {
    hideModal('confirmModal2');
    try {
      await db.collection('grants').add(collectedData);
      showModal('successModal');
      form.reset();
    } catch(e) { showModal('errorModal'); }
  });
  document.getElementById('confirmNo2')?.addEventListener('click', ()=> { hideModal('confirmModal2'); });
  document.getElementById('successOk')?.addEventListener('click', ()=> window.location.href='index.html');
  document.getElementById('errorOk')?.addEventListener('click', ()=> hideModal('errorModal'));
}

// ==================== نموذج الاتصال (contact.html) ====================
if (window.location.pathname.includes('contact.html')) {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', async (e)=>{ e.preventDefault();
    const data = new FormData(form);
    const obj = { name: data.get('name'), email: data.get('email'), message: data.get('message'), timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    try { await db.collection('contacts').add(obj); showModal('successModal'); form.reset(); } catch(e){ alert('حدث خطأ'); }
  });
  document.getElementById('successOk')?.addEventListener('click', ()=> window.location.href='index.html');
}

// ==================== لوحة المدير (admin.html) مع المصادقة ====================
if (window.location.pathname.includes('admin.html')) {
  let currentUser = null;
  let allGrants = [];
  let currentPage = 1;
  const pageSize = 5;

  const authSection = document.getElementById('authSection');
  const adminPanel = document.getElementById('adminPanel');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const searchInput = document.getElementById('searchInput');
  const filterProvince = document.getElementById('filterProvince');
  const sortBy = document.getElementById('sortBy');
  const container = document.getElementById('cardsContainer');
  const paginationDiv = document.getElementById('pagination');
  const totalSpan = document.getElementById('totalCount');

  function renderCards() {
    let filtered = allGrants.filter(g => {
      const searchTerm = searchInput.value.toLowerCase();
      const matchesSearch = !searchTerm || Object.values(g).some(val => String(val).toLowerCase().includes(searchTerm));
      const matchesProvince = !filterProvince.value || g.province === filterProvince.value;
      return matchesSearch && matchesProvince;
    });
    filtered.sort((a,b)=> sortBy.value === 'desc' ? (b.timestamp?.toMillis() - a.timestamp?.toMillis()) : (a.timestamp?.toMillis() - b.timestamp?.toMillis()));
    totalSpan.innerText = filtered.length;
    const start = (currentPage-1)*pageSize;
    const paginated = filtered.slice(start, start+pageSize);
    container.innerHTML = paginated.map(g => `
      <div class="grant-card" data-id="${g.id}">
        <h3>${g.firstName || ''} ${g.lastName || ''}</h3>
        <div class="field-row"><span class="field-label">الرقم الوطني:</span><span>${g.nationalId || ''}</span></div>
        <div class="field-row"><span class="field-label">الجوال:</span><span>${g.phone || ''}</span></div>
        <div class="field-row"><span class="field-label">المحافظة:</span><span>${g.province || ''}</span></div>
        <div class="field-row"><span class="field-label">البريد:</span><span>${g.email || ''}</span></div>
        <small>${g.timestamp ? new Date(g.timestamp.toMillis()).toLocaleString() : ''}</small>
      </div>
    `).join('');
    document.querySelectorAll('.grant-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const full = allGrants.find(g => g.id === id);
        if(full) {
          const details = Object.entries(full).map(([k,v]) => `<div><strong>${k}:</strong> ${v?.toString?.() || ''}</div>`).join('');
          document.getElementById('fullDataContent').innerHTML = details;
          showModal('detailModal');
        }
      });
    });
    // pagination controls
    const totalPages = Math.ceil(filtered.length/pageSize);
    let pagesHtml = '';
    for(let i=1;i<=totalPages;i++) pagesHtml += `<button class="btn-secondary page-btn" data-page="${i}">${i}</button>`;
    paginationDiv.innerHTML = pagesHtml;
    document.querySelectorAll('.page-btn').forEach(btn => btn.addEventListener('click', (e) => { currentPage = parseInt(e.target.dataset.page); renderCards(); }));
  }

  searchInput?.addEventListener('input', () => { currentPage=1; renderCards(); });
  filterProvince?.addEventListener('change', () => { currentPage=1; renderCards(); });
  sortBy?.addEventListener('change', () => renderCards());

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if(user) {
      authSection.style.display = 'none';
      adminPanel.style.display = 'block';
      db.collection('grants').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        allGrants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCards();
      });
    } else {
      authSection.style.display = 'block';
      adminPanel.style.display = 'none';
    }
  });
  loginBtn?.addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value;
    const pwd = document.getElementById('adminPassword').value;
    try { await auth.signInWithEmailAndPassword(email, pwd); document.getElementById('loginError').innerText = ''; } catch(e) { document.getElementById('loginError').innerText = 'فشل تسجيل الدخول: '+e.message; }
  });
  logoutBtn?.addEventListener('click', () => auth.signOut());
  document.getElementById('closeDetailBtn')?.addEventListener('click', () => hideModal('detailModal'));
}
