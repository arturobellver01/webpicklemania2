// Main interactivity for Picklemania

document.addEventListener('DOMContentLoaded', () => {
    // Current Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu on link click
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Scroll Progress Bar
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + "%";
    });

    // Reveal Animations on Scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.9;
        revealElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Inject Team Members
    const teamGrid = document.getElementById('team-grid');
    if (teamGrid && window.PICKLEMANIA_TEAM) {
        teamGrid.innerHTML = window.PICKLEMANIA_TEAM.map(player => `
            <div class="bg-white rounded-[3rem] overflow-hidden border border-black/5 shadow-lg group reveal">
                <div class="aspect-[4/5] relative overflow-hidden">
                    <img src="${player.image}" alt="${player.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/20 to-transparent"></div>
                    <div class="absolute bottom-8 left-8 right-8 text-white">
                        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${player.city}
                        </div>
                        <h3 class="text-3xl font-black mb-1 font-display">${player.name}</h3>
                        <p class="text-sm font-medium text-white/70 flex items-center gap-2">
                            Estilo: ${player.style}
                        </p>
                    </div>
                </div>
                <div class="p-10 space-y-6">
                    <p class="italic text-brand-gray leading-relaxed">"${player.phrase}"</p>
                    <div class="pt-6 border-t border-black/5 flex justify-between items-center">
                        <div>
                            <p class="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-1">Código</p>
                            <span class="font-mono font-bold text-lg bg-brand-light px-3 py-1 rounded-lg border border-black/5">${player.discountCode}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Inject Articles
    const articlesGrid = document.getElementById('articles-grid');
    const filterContainer = document.getElementById('article-filters');

    const renderArticles = (filter = 'all') => {
        if (!articlesGrid || !window.PICKLEMANIA_ARTICLES) return;
        
        const filtered = window.PICKLEMANIA_ARTICLES.filter(a => filter === 'all' || a.category === filter);
        
        articlesGrid.innerHTML = filtered.map(article => `
            <article class="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm hover:shadow-xl transition-all group reveal">
                <div class="aspect-video bg-brand-light relative overflow-hidden flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-10"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="absolute top-4 left-4">
                        <span class="bg-brand-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">${article.category}</span>
                    </div>
                </div>
                <div class="p-8 space-y-4">
                    <div class="flex items-center gap-4 text-xs text-brand-gray font-medium">
                        <span>${article.minutes} min</span>
                        <span>${article.date}</span>
                    </div>
                    <h3 class="text-2xl font-display font-bold group-hover:text-brand-black transition-colors">${article.title}</h3>
                    <p class="text-brand-gray text-sm leading-relaxed line-clamp-3">${article.excerpt}</p>
                    <a href="article.html?id=${article.id}" class="inline-flex items-center gap-2 font-bold text-sm pt-4 group-hover:translate-x-1 transition-transform">
                        Leer artículo <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                </div>
            </article>
        `).join('');
        
        // Re-trigger reveal for new elements
        revealOnScroll();
    };

    if (filterContainer) {
        const buttons = filterContainer.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderArticles(btn.dataset.filter);
            });
        });
    }

    renderArticles();

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (formStatus) {
                formStatus.textContent = 'Enviando...';
                formStatus.classList.remove('hidden');
                
                setTimeout(() => {
                    formStatus.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.';
                    contactForm.reset();
                }, 1500);
            }
        });
    }
});
