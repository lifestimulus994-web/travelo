(function () {
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  async function uploadImage(file, folder) {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseClient.storage.from('site-images').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabaseClient.storage.from('site-images').getPublicUrl(path).data.publicUrl;
  }

  function slugify(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9Ⴀ-ჿ-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ---------------- AUTH ----------------
  async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      initDashboard();
    } else {
      loginScreen.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(loginError, '');
    loginBtn.disabled = true;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    loginBtn.disabled = false;
    if (error) {
      showError(loginError, 'ელფოსტა ან პაროლი არასწორია.');
      return;
    }
    checkSession();
  });

  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    checkSession();
  });

  let dashboardInited = false;
  function initDashboard() {
    if (dashboardInited) { loadContent(); loadRoutes(); return; }
    dashboardInited = true;
    setupTabs();
    setupContentTab();
    setupRoutesTab();
    loadContent();
    loadRoutes();
  }

  // ---------------- TABS ----------------
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tabContent').classList.toggle('hidden', btn.dataset.tab !== 'content');
        document.getElementById('tabRoutes').classList.toggle('hidden', btn.dataset.tab !== 'routes');
      });
    });
  }

  // ---------------- CONTENT TAB ----------------
  function setupContentTab() {
    document.querySelectorAll('[data-upload]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        const key = input.getAttribute('data-upload');
        input.disabled = true;
        try {
          const url = await uploadImage(file, 'content');
          document.querySelector(`[data-key="${key}"]`).value = url;
          const preview = document.querySelector(`[data-preview="${key}"]`);
          if (preview) preview.src = url;
        } catch (err) {
          alert('ატვირთვა ვერ მოხერხდა: ' + err.message);
        }
        input.disabled = false;
      });
    });

    document.getElementById('saveContentBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveContentBtn');
      const status = document.getElementById('contentSaveStatus');
      btn.disabled = true;
      status.textContent = 'ინახება...';
      const rows = [];
      document.querySelectorAll('[data-key]').forEach((el) => {
        rows.push({ key: el.getAttribute('data-key'), value: el.value });
      });
      const { error } = await supabaseClient.from('site_content').upsert(rows, { onConflict: 'key' });
      btn.disabled = false;
      status.textContent = error ? 'შეცდომა შენახვისას' : 'შენახულია ✓';
      setTimeout(() => { status.textContent = ''; }, 2500);
    });
  }

  async function loadContent() {
    const { data, error } = await supabaseClient.from('site_content').select('key,value');
    if (error) return;
    const map = {};
    data.forEach((r) => { map[r.key] = r.value; });
    document.querySelectorAll('[data-key]').forEach((el) => {
      if (map[el.getAttribute('data-key')] != null) el.value = map[el.getAttribute('data-key')];
    });
    document.querySelectorAll('[data-preview]').forEach((img) => {
      const key = img.getAttribute('data-preview');
      if (map[key]) img.src = map[key];
    });
  }

  // ---------------- ROUTES TAB ----------------
  let currentPhotos = [];
  const modalScrim = document.getElementById('routeModalScrim');
  const routeForm = document.getElementById('routeForm');

  function setupRoutesTab() {
    document.getElementById('addRouteBtn').addEventListener('click', () => openRouteModal(null));
    document.getElementById('routeCancelBtn').addEventListener('click', closeRouteModal);
    modalScrim.addEventListener('click', (e) => { if (e.target === modalScrim) closeRouteModal(); });

    let slugTouched = false;
    document.getElementById('routeSlugInput').addEventListener('input', () => { slugTouched = true; });
    document.getElementById('routeTitleInput').addEventListener('input', (e) => {
      if (!slugTouched) document.getElementById('routeSlugInput').value = slugify(e.target.value);
    });

    document.getElementById('routeCoverUpload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.disabled = true;
      try {
        const url = await uploadImage(file, 'routes');
        document.getElementById('routeCoverPreview').src = url;
        document.getElementById('routeCoverPreview').dataset.url = url;
      } catch (err) {
        alert('ატვირთვა ვერ მოხერხდა: ' + err.message);
      }
      e.target.disabled = false;
    });

    document.getElementById('routePhotosUpload').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      e.target.disabled = true;
      try {
        for (const file of files) {
          const url = await uploadImage(file, 'routes');
          currentPhotos.push(url);
        }
        renderPhotoGrid();
      } catch (err) {
        alert('ატვირთვა ვერ მოხერხდა: ' + err.message);
      }
      e.target.value = '';
      e.target.disabled = false;
    });

    routeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('routeSaveBtn');
      if (saveBtn.disabled) return;
      saveBtn.disabled = true;
      showError(document.getElementById('routeFormError'), '');

      const payload = {
        title: document.getElementById('routeTitleInput').value.trim(),
        slug: slugify(document.getElementById('routeSlugInput').value),
        badge: document.getElementById('routeBadgeInput').value.trim(),
        price_text: document.getElementById('routePriceInput').value.trim(),
        description: document.getElementById('routeDescInput').value.trim(),
        position: parseInt(document.getElementById('routePositionInput').value, 10) || 0,
        cover_image: document.getElementById('routeCoverPreview').dataset.url || '',
        photos: currentPhotos,
      };

      if (!payload.title || !payload.slug) {
        showError(document.getElementById('routeFormError'), 'სახელი და slug სავალდებულოა.');
        saveBtn.disabled = false;
        return;
      }

      const id = document.getElementById('routeId').value;
      const query = id
        ? supabaseClient.from('routes').update(payload).eq('id', id)
        : supabaseClient.from('routes').insert(payload);
      const { error } = await query;

      saveBtn.disabled = false;
      if (error) {
        showError(document.getElementById('routeFormError'), error.message.includes('duplicate') ? 'ეს slug უკვე გამოყენებულია.' : 'შენახვა ვერ მოხერხდა.');
        return;
      }
      closeRouteModal();
      loadRoutes();
    });
  }

  function renderPhotoGrid() {
    const grid = document.getElementById('routePhotosGrid');
    grid.innerHTML = currentPhotos.map((url, i) => `
      <div class="photo-thumb">
        <img src="${url}" alt="" />
        <button type="button" data-remove="${i}">&times;</button>
      </div>
    `).join('');
    grid.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPhotos.splice(parseInt(btn.dataset.remove, 10), 1);
        renderPhotoGrid();
      });
    });
  }

  function openRouteModal(route) {
    document.getElementById('routeModalTitle').textContent = route ? 'მარშრუტის რედაქტირება' : 'მარშრუტის დამატება';
    document.getElementById('routeId').value = route ? route.id : '';
    document.getElementById('routeTitleInput').value = route ? route.title : '';
    document.getElementById('routeSlugInput').value = route ? route.slug : '';
    document.getElementById('routeBadgeInput').value = route ? (route.badge || '') : '';
    document.getElementById('routePriceInput').value = route ? (route.price_text || '') : '';
    document.getElementById('routeDescInput').value = route ? (route.description || '') : '';
    document.getElementById('routePositionInput').value = route ? route.position : 0;
    document.getElementById('routeCoverPreview').src = route ? (route.cover_image || '') : '';
    document.getElementById('routeCoverPreview').dataset.url = route ? (route.cover_image || '') : '';
    currentPhotos = route && Array.isArray(route.photos) ? [...route.photos] : [];
    renderPhotoGrid();
    showError(document.getElementById('routeFormError'), '');
    modalScrim.classList.remove('hidden');
  }

  function closeRouteModal() {
    modalScrim.classList.add('hidden');
    routeForm.reset();
    currentPhotos = [];
  }

  async function loadRoutes() {
    const { data, error } = await supabaseClient.from('routes').select('*').order('position', { ascending: true });
    const tbody = document.getElementById('routesTableBody');
    const empty = document.getElementById('routesEmpty');
    if (error) return;
    if (!data.length) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = data.map((r) => `
      <tr>
        <td><img src="${r.cover_image || ''}" alt="" /></td>
        <td>${r.title}</td>
        <td>${r.price_text || ''}</td>
        <td>${r.position}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-ghost btn-sm" data-edit="${r.id}">რედაქტირება</button>
          <button class="btn btn-danger btn-sm" data-delete="${r.id}">წაშლა</button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const route = data.find((r) => r.id === btn.dataset.edit);
        openRouteModal(route);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('წავშალო მარშრუტი?')) return;
        btn.disabled = true;
        await supabaseClient.from('routes').delete().eq('id', btn.dataset.delete);
        loadRoutes();
      });
    });
  }

  checkSession();
})();
