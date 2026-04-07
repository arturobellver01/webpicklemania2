document.addEventListener('DOMContentLoaded', () => {
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

    const revealTargets = document.querySelectorAll('.reveal');
    const revealNow = () => {
        const trigger = window.innerHeight * 0.92;
        revealTargets.forEach((el) => {
            if (el.getBoundingClientRect().top < trigger) el.classList.add('active');
        });
    };
    window.addEventListener('scroll', revealNow, { passive: true });
    revealNow();

    const teamGrid = document.getElementById('team-grid');
    if (teamGrid && window.PICKLEMANIA_TEAM) {
        teamGrid.innerHTML = window.PICKLEMANIA_TEAM.map((player) => `
        <article class="card-soft overflow-hidden reveal">
            <div class="aspect-[4/5] image-placeholder flex items-end p-6">
                <div class="bg-black/55 backdrop-blur-sm text-white p-4 rounded-2xl w-full">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-white/70">${player.city}</p>
                    <h3 class="text-2xl font-display font-black">${player.name}</h3>
                    <p class="text-sm text-white/80">${player.style}</p>
                </div>
            </div>
            <div class="p-8 space-y-4">
                <p class="text-brand-gray italic">“${player.phrase}”</p>
                <p class="text-xs uppercase tracking-[0.14em] text-brand-gray">Código comunidad: <span class="text-brand-black font-semibold">${player.discountCode}</span></p>
                ${player.placeholder ? '<p class="text-xs text-brand-gray">Contenido editable pendiente de confirmación.</p>' : ''}
            </div>
        </article>`).join('');
        revealNow();
    }

    const articlesGrid = document.getElementById('articles-grid');
    const filters = document.getElementById('article-filters');
    const renderArticles = (filter = 'all') => {
        if (!articlesGrid || !window.PICKLEMANIA_ARTICLES) return;
        const items = window.PICKLEMANIA_ARTICLES.filter((a) => filter === 'all' || a.category === filter);
        articlesGrid.innerHTML = items.map((article) => `
            <article class="card-soft p-8 reveal">
                <p class="eyebrow mb-3">${article.categoryLabel}</p>
                <h3 class="text-2xl font-display font-bold leading-tight mb-3">${article.title}</h3>
                <p class="text-sm text-brand-gray mb-5">${article.excerpt}</p>
                <p class="text-xs text-brand-gray mb-5">${article.minutes} min · ${article.date}</p>
                <a href="article.html?id=${article.id}" class="font-semibold text-sm">Leer guía →</a>
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
