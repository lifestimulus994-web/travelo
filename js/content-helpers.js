// Shared helpers for pulling editable content out of Supabase and hydrating the static markup.

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function loadSiteContent() {
  const { data, error } = await supabaseClient.from('site_content').select('key,value');
  if (error) {
    console.error('site_content load failed', error);
    return {};
  }
  const map = {};
  for (const row of data) map[row.key] = row.value;
  return map;
}

// Applies content values to every [data-content-key] element already on the page.
// data-content-mode: "text" (default) | "src" | "bg" | "tel" | "mailto"
function applyContentKeys(map) {
  document.querySelectorAll('[data-content-key]').forEach((el) => {
    const key = el.getAttribute('data-content-key');
    const value = map[key];
    if (value == null || value === '') return;
    const mode = el.getAttribute('data-content-mode') || 'text';
    if (mode === 'src') el.src = value;
    else if (mode === 'bg') el.style.backgroundImage = `url("${value}")`;
    else if (mode === 'tel') el.href = `tel:${value}`;
    else if (mode === 'mailto') { el.href = `mailto:${value}`; el.textContent = value; }
    else el.textContent = value;
  });
}

// Rewrites every WhatsApp / tel link on the page to use the admin-configured number,
// keeping each link's own prefilled message text intact.
function applyPhoneWaNumbers(map) {
  const wa = map.whatsapp_number;
  const phone = map.phone_number;
  if (wa) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
      a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${wa}`);
    });
  }
  if (phone) {
    document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
      if (!a.hasAttribute('data-content-key')) a.href = `tel:${phone}`;
    });
  }
}

function buildWaLink(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
