(() => {
  const API_BASE = window.PICKLEMANIA_API_BASE || '';
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const OVERPASS = 'https://overpass-api.de/api/interpreter';
  const fallbackCourts = [
    { id: 'pm-barcelona-demo', source: 'picklemania', name: 'Club Pickleball Barcelona', address: 'Barcelona', city: 'Barcelona', lat: 41.3851, lng: 2.1734, court_count: 4, surface_type: 'outdoor', access_type: 'private', price_type: 'paid', website: 'https://picklemaniaweb.es', description: 'Ficha semilla de Picklemania para validar la experiencia del mapa.', status: 'approved' },
    { id: 'pm-madrid-demo', source: 'picklemania', name: 'Pickleball Madrid Centro', address: 'Madrid', city: 'Madrid', lat: 40.4168, lng: -3.7038, court_count: 2, surface_type: 'indoor', access_type: 'public', price_type: 'paid', website: '', description: 'Instalación preparada para combinar datos propios y OSM.', status: 'approved' }
  ];
  let map, markerLayer, addMode = false, tempMarker = null, filter = 'all', searchTimer, allCourts = [];
  const $ = (id) => document.getElementById(id);
  const pickleIcon = L.divIcon({ className: 'pickle-marker', html: '<span>🏓</span>', iconSize: [42, 42], iconAnchor: [21, 40], popupAnchor: [0, -36] });

  function init() {
    map = L.map('pickleball-map', { zoomControl: false }).setView([40.4168, -3.7038], 6);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    bindEvents();
    loadViewportCourts();
  }

  function bindEvents() {
    map.on('moveend', debounce(loadViewportCourts, 650));
    map.on('click', (e) => { if (addMode) openFormAt(e.latlng); });
    $('court-search').addEventListener('input', (e) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => searchPlaces(e.target.value), 450); });
    document.querySelectorAll('.playfinder-filters button').forEach((btn) => btn.addEventListener('click', () => { document.querySelectorAll('.playfinder-filters button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); filter = btn.dataset.filter; render(); }));
    $('near-me').addEventListener('click', locateMe);
    $('add-court').addEventListener('click', () => { addMode = true; $('add-hint').classList.add('active'); map.getContainer().classList.add('is-adding'); });
    ['close-modal','cancel-form'].forEach(id => $(id).addEventListener('click', closeForm));
    $('court-form').addEventListener('submit', submitCourt);
  }

  async function loadViewportCourts() {
    const bounds = map.getBounds();
    const [own, osm] = await Promise.all([fetchOwnCourts(bounds), fetchOsmCourts(bounds)]);
    allCourts = dedupe([...own, ...osm]);
    render();
  }

  async function fetchOwnCourts(bounds) {
    try {
      const qs = new URLSearchParams({ status: 'approved', south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() });
      const res = await fetch(`${API_BASE}/courts?${qs}`);
      if (!res.ok) throw new Error('No backend');
      return await res.json();
    } catch { return fallbackCourts.filter(c => bounds.contains([c.lat, c.lng])); }
  }

  async function fetchOsmCourts(bounds) {
    if (map.getZoom() < 9) return [];
    const b = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `[out:json][timeout:12];(node["sport"="pickleball"](${b});way["sport"="pickleball"](${b});relation["sport"="pickleball"](${b});node["name"~"pickleball",i](${b});way["name"~"pickleball",i](${b}););out center tags 80;`;
    try {
      const res = await fetch(OVERPASS, { method: 'POST', body: query });
      const data = await res.json();
      return (data.elements || []).map((el) => ({ id: `osm-${el.type}-${el.id}`, source: 'osm', name: el.tags?.name || 'Pista de pickleball', address: formatOsmAddress(el.tags), city: el.tags?.['addr:city'] || '', lat: el.lat || el.center?.lat, lng: el.lon || el.center?.lon, court_count: Number(el.tags?.courts || el.tags?.['capacity:courts']) || 1, surface_type: /indoor/i.test(el.tags?.indoor || '') ? 'indoor' : 'outdoor', access_type: el.tags?.access === 'private' ? 'private' : 'public', price_type: el.tags?.fee === 'yes' ? 'paid' : 'unknown', website: el.tags?.website || el.tags?.contact?.website || '', description: 'Dato detectado en OpenStreetMap mediante sport=pickleball o nombre relacionado. Puede estar incompleto.', status: 'approved' })).filter(c => c.lat && c.lng);
    } catch { return []; }
  }

  function render() {
    markerLayer.clearLayers();
    const visible = allCourts.filter(matchesFilter);
    visible.forEach(court => L.marker([court.lat, court.lng], { icon: pickleIcon }).bindPopup(popupHtml(court)).on('click', () => selectCard(court.id)).addTo(markerLayer));
    $('visible-count').textContent = visible.length;
    $('courts-list').innerHTML = visible.length ? visible.map(cardHtml).join('') : '<p class="text-brand-gray text-sm">Mueve o acerca el mapa para encontrar pistas.</p>';
    $('courts-list').querySelectorAll('[data-court-id]').forEach(card => card.addEventListener('click', () => focusCourt(card.dataset.courtId)));
  }
  function matchesFilter(c) { return filter === 'all' || c.surface_type === filter || (filter === 'free' && c.price_type === 'free') || (filter === 'club' && c.access_type === 'private'); }
  function popupHtml(c) { return `<strong>${esc(c.name)}</strong><br>${esc(c.address || 'Dirección no disponible')}<br>${label(c.surface_type)} · ${c.court_count || 1} pista(s)<br>${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">Web</a><br>` : ''}<small>${esc(c.description || '')}</small>`; }
  function cardHtml(c) { return `<article class="playfinder-card" data-court-id="${esc(c.id)}"><h3>${esc(c.name)}</h3><p>📍 ${esc(c.city || c.address || 'Ubicación en mapa')}</p><div><span>🏓 ${c.court_count || 1} pistas</span><span>${label(c.surface_type)}</span><span>${c.price_type === 'free' ? 'Gratis' : c.price_type === 'paid' ? 'De pago' : 'Precio no indicado'}</span></div></article>`; }
  function focusCourt(id) { const c = allCourts.find(x => x.id === id); if (!c) return; map.setView([c.lat, c.lng], Math.max(map.getZoom(), 15)); L.popup().setLatLng([c.lat, c.lng]).setContent(popupHtml(c)).openOn(map); selectCard(id); }
  function selectCard(id) { document.querySelectorAll('.playfinder-card').forEach(c => c.classList.toggle('active', c.dataset.courtId === id)); }

  async function searchPlaces(q) {
    const box = $('search-results'); if (q.trim().length < 3) { box.classList.add('hidden'); return; }
    const url = `${NOMINATIM}?${new URLSearchParams({ q, format: 'jsonv2', limit: 5, addressdetails: 1, countrycodes: 'es,pt,fr,it,de,nl,be,at' })}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } }); const places = await res.json();
    box.innerHTML = places.map(p => `<button type="button" data-lat="${p.lat}" data-lon="${p.lon}">${esc(p.display_name)}</button>`).join(''); box.classList.toggle('hidden', !places.length);
    box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { map.setView([b.dataset.lat, b.dataset.lon], 13); $('court-search').value = b.textContent; box.classList.add('hidden'); }));
  }
  function locateMe() { navigator.geolocation?.getCurrentPosition(pos => map.setView([pos.coords.latitude, pos.coords.longitude], 13), () => alert('No hemos podido obtener tu ubicación.')); }
  function openFormAt(latlng) { if (tempMarker) tempMarker.remove(); tempMarker = L.marker(latlng, { icon: pickleIcon }).addTo(map); $('court-form').lat.value = latlng.lat; $('court-form').lng.value = latlng.lng; $('court-modal').classList.remove('hidden'); }
  function closeForm() { $('court-modal').classList.add('hidden'); addMode = false; $('add-hint').classList.remove('active'); map.getContainer().classList.remove('is-adding'); }
  async function submitCourt(e) { e.preventDefault(); const form = e.currentTarget; const payload = Object.fromEntries(new FormData(form)); payload.lat = Number(payload.lat); payload.lng = Number(payload.lng); payload.status = 'pending'; $('form-status').textContent = 'Guardando...'; try { const res = await fetch(`${API_BASE}/courts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error(); $('form-status').textContent = 'Pista enviada para moderación.'; setTimeout(closeForm, 900); } catch { const local = { ...payload, id: `local-${Date.now()}`, source: 'local-preview' }; allCourts.push(local); render(); $('form-status').textContent = 'Backend no configurado: se muestra como vista previa local. Configura Supabase para persistirla como pending.'; setTimeout(closeForm, 1400); } }
  function dedupe(courts) { const seen = new Set(); return courts.filter(c => { const key = `${Math.round(c.lat*1000)}:${Math.round(c.lng*1000)}:${String(c.name).toLowerCase().slice(0,18)}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
  function formatOsmAddress(t={}) { return [t['addr:street'], t['addr:housenumber'], t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ') || 'Dirección no disponible'; }
  function label(v) { return v === 'indoor' ? 'Indoor' : v === 'outdoor' ? 'Outdoor' : 'Sin indicar'; }
  function esc(s='') { return String(s).replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  document.addEventListener('DOMContentLoaded', init);
})();
