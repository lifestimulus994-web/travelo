// Homepage: hydrate editable content blocks + render routes (მარშრუტები) from Supabase.
(async function () {
  const contentMap = await loadSiteContent();
  applyContentKeys(contentMap);
  applyPhoneWaNumbers(contentMap);

  const wa = contentMap.whatsapp_number || '995595171727';
  const grid = document.getElementById('destGrid');
  const empty = document.getElementById('destEmpty');
  if (!grid) return;

  const { data: routes, error } = await supabaseClient
    .from('routes')
    .select('slug,title,badge,price_text,cover_image')
    .order('position', { ascending: true });

  if (error) {
    console.error('routes load failed', error);
    return;
  }

  if (!routes || routes.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = routes.map((r) => `
    <div class="dest-card reveal">
      <img src="${escapeHtml(r.cover_image || 'images/hero-bg.jpg')}" alt="${escapeHtml(r.title)}" loading="lazy" />
      <div class="dest-card-overlay"></div>
      ${r.badge ? `<span class="dest-badge">${escapeHtml(r.badge)}</span>` : ''}
      <div class="dest-info">
        <h3><a href="route.html?slug=${encodeURIComponent(r.slug)}" style="color:inherit;text-decoration:none;">${escapeHtml(r.title)}</a></h3>
        <span class="price font-en">${escapeHtml(r.price_text || '')}</span>
        <a class="btn btn-primary" href="route.html?slug=${encodeURIComponent(r.slug)}">დეტალურად</a>
      </div>
    </div>
  `).join('');
})();
