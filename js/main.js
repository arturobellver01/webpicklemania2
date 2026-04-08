document.addEventListener('DOMContentLoaded', () => {
    const isArticlePage = window.location.pathname.includes('/aprende/') && window.location.pathname.endsWith('.html');
    const basePath = isArticlePage ? '../' : '';

    const header = document.querySelector('header');
    if (header) {
        header.className = 'sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5';
        header.innerHTML = `
    <div class="container mx-auto px-4 h-20 flex items-center justify-between">
      <a href="${basePath}index.html" class="flex items-center">
        <img src="${basePath}img/LogoPicklemania3.png" alt="Picklemania" class="logo">
      </a>
      <nav class="hidden md:flex items-center gap-8">
        <a href="${basePath}marca.html" class="text-sm font-medium text-brand-gray hover:text-brand-black transition-colors">Nuestra Marca</a>
        <a href="${basePath}coleccion.html" class="text-sm font-medium text-brand-gray hover:text-brand-black transition-colors">Colección</a>
        <a href="${basePath}team.html" class="text-sm font-medium text-brand-gray hover:text-brand-black transition-colors">Team</a>
        <a href="${basePath}aprende.html" class="text-sm font-medium text-brand-gray hover:text-brand-black transition-colors">Aprende</a>
        <a href="${basePath}colabora.html" class="text-sm font-medium text-brand-gray hover:text-brand-black transition-colors">Colabora</a>
        <a href="${basePath}colabora.html#contacto" class="bg-brand-black text-white px-5 py-2.5 rounded-full text-sm font-bold">Contacto</a>
      </nav>
      <button id="mobile-menu-toggle" class="md:hidden p-2" aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-black/5 p-4 space-y-3">
      <a href="${basePath}marca.html" class="block text-lg font-semibold">Nuestra Marca</a>
      <a href="${basePath}coleccion.html" class="block text-lg font-semibold">Colección</a>
      <a href="${basePath}team.html" class="block text-lg font-semibold">Team</a>
      <a href="${basePath}aprende.html" class="block text-lg font-semibold">Aprende</a>
      <a href="${basePath}future.html" class="block text-lg font-semibold">Más que equipamiento</a>
      <a href="${basePath}colabora.html" class="block text-lg font-semibold">Colabora</a>
    </div>`;
    }

    const footer = document.querySelector('footer');
    if (footer) {
        footer.className = 'bg-white border-t border-black/5 pt-20 pb-10';
        footer.innerHTML = `
    <div class="container mx-auto px-4">
      <div class="grid md:grid-cols-4 gap-10 mb-12">
        <div class="space-y-5 md:col-span-2">
          <a href="${basePath}index.html" class="flex items-center"><img src="${basePath}img/LogoPicklemania2.png" alt="Picklemania" class="h-10 w-auto"></a>
          <p class="text-sm text-brand-gray max-w-md">Marca europea en evolución. Diseñada en España y producida en Europa para construir el juego con proximidad, criterio y consistencia.</p>
          <p class="text-xs tracking-[0.14em] uppercase text-brand-gray">Designed in Spain · Made in Europe</p>
        </div>
        <div><h4 class="font-semibold mb-4">Explorar</h4><ul class="space-y-2 text-sm text-brand-gray"><li><a href="${basePath}marca.html">Nuestra Marca</a></li><li><a href="${basePath}coleccion.html">Colección Black & White</a></li><li><a href="${basePath}team.html">Team Picklemania</a></li><li><a href="${basePath}aprende.html">Aprende Pickleball</a></li></ul></div>
        <div><h4 class="font-semibold mb-4">Origen europeo</h4><ul class="space-y-2 text-sm text-brand-gray"><li>Diseñado en España</li><li>Fabricado en Europa / Portugal</li><li>Control de calidad cercano</li><li>Comunidad temprana</li></ul></div>
        <div id="newsletter" class="md:col-span-2 lg:col-span-4 rounded-2xl bg-brand-light/70 p-6 border border-black/5">
          <h4 class="font-semibold mb-2">Newsletter</h4>
          <p class="text-sm text-brand-gray mb-4">Sigue la evolución del juego.</p>
          <form class="flex flex-col sm:flex-row gap-2">
            <input type="email" aria-label="Email" placeholder="Tu email" class="flex-1 bg-white rounded-xl px-4 py-3 text-sm border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-black/20">
            <button class="bg-brand-black text-white rounded-xl px-5 py-3 text-sm font-semibold">Unirme</button>
          </form>
        </div>
      </div>
      <div class="border-t border-black/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-brand-gray">
        <p>© <span data-current-year></span> Picklemania. Todos los derechos reservados.</p>
        <div class="flex gap-4"><a href="#">Privacidad</a><a href="#">Aviso legal</a><a href="${basePath}colabora.html#contacto">Contacto profesional</a></div>
      </div>
    </div>`;
    }

    const yearNodes = document.querySelectorAll('[data-current-year]');
    yearNodes.forEach((n) => (n.textContent = new Date().getFullYear()));

    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    const progress = document.getElementById('scroll-progress');
    const setProgress = () => {
        if (!progress) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const value = max > 0 ? (window.scrollY / max) * 100 : 0;
        progress.style.width = `${value}%`;
    };
    window.addEventListener('scroll', setProgress, { passive: true });
    setProgress();

    const revealNow = () => {
        const trigger = window.innerHeight * 0.92;
        document.querySelectorAll('.reveal').forEach((el) => {
            if (el.getBoundingClientRect().top < trigger) el.classList.add('active');
        });
    };
    window.addEventListener('scroll', revealNow, { passive: true });
    revealNow();

    const teamGrid = document.getElementById('team-grid');
    if (teamGrid && window.PICKLEMANIA_TEAM) {
    teamGrid.innerHTML = window.PICKLEMANIA_TEAM.map((player) => `
        <article class="card-soft overflow-hidden reveal">
            <div class="relative aspect-[4/5]">
                <img
                    src="${player.image}"
                    alt="${player.name}"
                    class="w-full h-full object-cover"
                />
                <div class="absolute inset-x-0 bottom-0 p-6">
                    <div class="bg-black/55 backdrop-blur-sm text-white p-4 rounded-2xl w-full">
                        <p class="text-[11px] uppercase tracking-[0.18em] text-white/70">${player.city}</p>
                        <h3 class="text-2xl font-display font-black">${player.name}</h3>
                        <p class="text-sm text-white/80">${player.style}</p>
                    </div>
                </div>
            </div>
            <div class="p-8 space-y-4">
                <p class="text-brand-gray italic">“${player.phrase}”</p>

                ${player.instagram ? `<a href="${player.instagram}" target="_blank" rel="noopener noreferrer" class="inline-block text-sm font-medium underline">Instagram</a>` : ''}
                ${player.placeholder ? '<p class="text-xs text-brand-gray">Contenido editable pendiente de confirmación.</p>' : ''}
            </div>
        </article>
    `).join('');
        revealNow();
    }

    const articlesGrid = document.getElementById('articles-grid');
    const filters = document.getElementById('article-filters');

    const normalize = (value) => (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const renderArticles = (filter = 'all') => {
        if (!articlesGrid || !window.PICKLEMANIA_ARTICLES) return;
        const items = window.PICKLEMANIA_ARTICLES.filter((a) => filter === 'all' || normalize(a.category) === filter);
        if (!items.length) {
            articlesGrid.innerHTML = '<p class="text-brand-gray">No hay artículos disponibles para esta categoría.</p>';
            return;
        }
        articlesGrid.innerHTML = items.map((article) => `
            <article class="card-soft p-8 reveal flex flex-col h-full">
                <p class="eyebrow mb-3">${article.category}</p>
                <h3 class="text-2xl font-display font-bold leading-tight mb-3">${article.title}</h3>
                <p class="text-sm text-brand-gray mb-5">${article.description}</p>
                                <a href="${article.url}" class="brand-btn brand-btn-primary mt-auto">Leer artículo</a>
            </article>
        `).join('');
        revealNow();
    };

    if (filters) {
        const buttons = filters.querySelectorAll('button');
        buttons.forEach((btn) => btn.addEventListener('click', () => {
            buttons.forEach((b) => b.classList.remove('bg-brand-black', 'text-white'));
            btn.classList.add('bg-brand-black', 'text-white');
            renderArticles(btn.dataset.filter);
        }));
    }
    renderArticles();
});
