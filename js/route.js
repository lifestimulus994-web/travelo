(async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  const contentMap = await loadSiteContent();
  applyContentKeys(contentMap);
  applyPhoneWaNumbers(contentMap);
  const wa = contentMap.whatsapp_number || '995595171727';

  const main = document.getElementById('routeMain');
  const notFound = document.getElementById('routeNotFound');

  if (!slug) {
    main.style.display = 'none';
    notFound.style.display = 'block';
    return;
  }

  const { data: route, error } = await supabaseClient
    .from('routes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !route) {
    main.style.display = 'none';
    notFound.style.display = 'block';
    return;
  }

  document.title = `${route.title} — Travelo`;
  document.getElementById('routeHeroBg').style.backgroundImage =
    `url("${escapeHtml(route.cover_image || 'images/hero-bg.jpg')}")`;
  document.getElementById('routeTitle').textContent = route.title;

  const badgeEl = document.getElementById('routeBadge');
  if (route.badge) {
    badgeEl.textContent = route.badge;
    badgeEl.style.display = 'inline-block';
  }

  document.getElementById('routePrice').textContent = route.price_text || '';
  document.getElementById('routeDescription').textContent = route.description || '';

  const photos = Array.isArray(route.photos) && route.photos.length
    ? route.photos
    : [route.cover_image].filter(Boolean);
  const gallery = document.getElementById('routeGallery');
  gallery.innerHTML = photos
    .map((url) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(route.title)}" loading="lazy" />`)
    .join('');

  const waText = `გამარჯობა, მაინტერესებს ტური: ${route.title}`;
  const waHref = buildWaLink(wa, waText);
  ['waBookBtn', 'waBookBtnMobile', 'waBookBtnBody', 'waFab'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = waHref;
  });
})();
