document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-apparel-product]');
  if (!form) return;

  const product = window.PicklemaniaProducts?.getById(form.dataset.apparelProduct);
  if (!product) return;

  const nameWrap = document.getElementById('personalization-name-wrap');
  const nameInput = document.getElementById('personalization-name');
  const feedback = form.querySelector('[data-feedback]');
  const priceNode = document.getElementById('configured-price');
  const qtyInput = document.getElementById('product-quantity');
  const editionLabel = { pro: 'Pro Tour Edition', competition: 'Competition Edition' };

  function selected(name) { return form.querySelector(`[name="${name}"]:checked`)?.value || ''; }
  function quantity() { return Math.max(1, Math.floor(Number(qtyInput?.value || 1))); }
  function hasPersonalization() { return selected('personalization') === 'yes'; }
  function syncPersonalization() {
    const visible = hasPersonalization();
    nameWrap?.classList.toggle('hidden', !visible);
    nameInput?.toggleAttribute('required', visible);
    if (!visible && nameInput) nameInput.value = '';
  }

  function buildConfiguration() {
    const isKit = product.type === 'kit';
    const configuration = isKit ? {
      shirtEdition: selected('shirt-edition'), shirtSize: selected('shirt-size'),
      pantsEdition: selected('pants-edition'), pantsSize: selected('pants-size')
    } : { edition: selected('edition'), size: selected('size') };
    if (product.allowsPersonalization) configuration.personalizationName = hasPersonalization() ? nameInput.value.trim() : '';
    return configuration;
  }

  function configurationSummary(config) {
    const lines = product.type === 'kit'
      ? [`Camiseta: ${editionLabel[config.shirtEdition]} · Talla ${config.shirtSize}`, `Pantalón: ${editionLabel[config.pantsEdition]} · Talla ${config.pantsSize}`]
      : [`Modelo: ${editionLabel[config.edition]} · Talla ${config.size}`];
    if (product.allowsPersonalization) lines.push(config.personalizationName ? `Personalización: ${config.personalizationName} (+5€)` : 'Personalización: Sin personalización');
    return lines.join('\n');
  }

  function priceCents(config) { return Number(product.price) + (config.personalizationName ? 500 : 0); }
  function validate(config) {
    if (!Number.isFinite(Number(product.price)) || product.price === null) return 'El precio de este producto está pendiente de configuración.';
    if (Object.entries(config).some(([key, value]) => key !== 'personalizationName' && !['pro', 'competition', 'XS', 'S', 'M', 'L', 'XL'].includes(value))) return 'Selecciona todas las opciones antes de continuar.';
    if (hasPersonalization() && !config.personalizationName) return 'Escribe el nombre para la personalización.';
    return '';
  }

  function add() {
    const config = buildConfiguration();
    const error = validate(config);
    if (error) {
      feedback.textContent = error;
      feedback.classList.remove('opacity-0', 'text-green-700');
      feedback.classList.add('text-red-700');
      return false;
    }
    const cents = priceCents(config);
    const configurationKey = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    const cartKey = `${product.id}:${configurationKey}`;
    window.PicklemaniaCart?.addToCart({ ...product, cartKey, price: cents / 100, unitAmount: cents, displayPrice: `${(cents / 100).toFixed(2).replace('.', ',')}€`, configuration: config, configurationSummary: configurationSummary(config), quantity: quantity() });
    feedback.textContent = 'Producto añadido al carrito';
    feedback.classList.remove('opacity-0', 'text-red-700');
    feedback.classList.add('text-green-700');
    window.setTimeout(() => feedback.classList.add('opacity-0'), 1800);
    return true;
  }

  function initEditionGallery() {
    const gallery = document.querySelector('[data-edition-gallery]');
    const mainImage = document.getElementById('product-main-image');
    const mainButton = document.querySelector('[data-gallery-main]');
    const thumbs = gallery?.querySelector('[data-gallery-thumbs]');
    const source = gallery?.dataset.galleryEditionSource || 'edition';
    const imagesByEdition = product.galleryByEdition;
    if (!gallery || !mainImage || !mainButton || !thumbs || !imagesByEdition) return;

    let activeEdition = selected(source);
    let activeIndex = 0;
    let opener = null;
    const modal = document.createElement('div');
    modal.className = 'gallery-lightbox hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Imagen ampliada del producto');
    modal.innerHTML = '<div class="gallery-lightbox__content"><button type="button" class="gallery-lightbox__close" aria-label="Cerrar imagen">×</button><button type="button" class="gallery-lightbox__previous" aria-label="Imagen anterior">‹</button><img class="gallery-lightbox__image" alt=""><button type="button" class="gallery-lightbox__next" aria-label="Imagen siguiente">›</button></div>';
    document.body.append(modal);

    const modalImage = modal.querySelector('.gallery-lightbox__image');
    const closeButton = modal.querySelector('.gallery-lightbox__close');
    const previousButton = modal.querySelector('.gallery-lightbox__previous');
    const nextButton = modal.querySelector('.gallery-lightbox__next');
    const images = () => imagesByEdition[activeEdition] || [];
    const altFor = () => `${product.name} — ${editionLabel[activeEdition]} · Imagen ${activeIndex + 1}`;

    function renderMain() {
      const image = images()[activeIndex];
      if (!image) return;
      mainImage.src = image;
      mainImage.alt = altFor();
      modalImage.src = image;
      modalImage.alt = altFor();
      thumbs.querySelectorAll('[data-gallery-image]').forEach((button, index) => {
        button.setAttribute('aria-pressed', String(index === activeIndex));
      });
    }

    function renderThumbs() {
      thumbs.innerHTML = images().map((image, index) => `<button type="button" data-gallery-image="${image}" data-gallery-edition="${activeEdition}" aria-label="Ver imagen ${index + 1} de ${editionLabel[activeEdition]}" aria-pressed="${index === activeIndex}"><img src="${image}" alt="" loading="lazy"></button>`).join('');
      thumbs.querySelectorAll('[data-gallery-image]').forEach((button, index) => {
        button.addEventListener('click', () => {
          activeIndex = index;
          renderMain();
        });
      });
    }

    function selectEdition(edition) {
      if (!imagesByEdition[edition]) return;
      activeEdition = edition;
      activeIndex = 0;
      renderThumbs();
      renderMain();
    }

    function closeLightbox() {
      modal.classList.add('hidden');
      document.body.classList.remove('gallery-lightbox-open');
      opener?.focus();
    }
    function move(step) {
      activeIndex = (activeIndex + step + images().length) % images().length;
      renderMain();
    }

    mainButton.addEventListener('click', () => {
      opener = mainButton;
      modal.classList.remove('hidden');
      document.body.classList.add('gallery-lightbox-open');
      closeButton.focus();
    });
    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));
    modal.addEventListener('click', (event) => { if (event.target === modal) closeLightbox(); });
    document.addEventListener('keydown', (event) => {
      if (modal.classList.contains('hidden')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    });

    form.querySelectorAll(`[name="${source}"]`).forEach((node) => node.addEventListener('change', () => selectEdition(node.value)));
    selectEdition(activeEdition);
  }

  form.querySelectorAll('[name="personalization"]').forEach((node) => node.addEventListener('change', syncPersonalization));
  form.querySelector('.add-to-cart-btn')?.addEventListener('click', add);
  form.querySelector('.buy-now-btn')?.addEventListener('click', () => { if (add()) window.location.href = window.PicklemaniaUrl?.cleanUrl('carrito') || 'carrito'; });
  if (Number.isFinite(Number(product.price)) && product.price !== null) priceNode.textContent = product.displayPrice;
  syncPersonalization();
  initEditionGallery();
});
