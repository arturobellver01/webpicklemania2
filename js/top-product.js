document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-top-product]');
  if (!form) return;

  const product = window.PicklemaniaProducts?.getById(form.dataset.topProduct);
  if (!product) return;

  const nameWrap = document.getElementById('top-personalization-fields');
  const nameInput = document.getElementById('top-personalization-name');
  const flagsInput = document.getElementById('top-personalization-flags');
  const feedback = form.querySelector('[data-feedback]');
  const priceNode = document.getElementById('configured-price');
  const qtyInput = document.getElementById('product-quantity');
  const formatPrice = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')}€`;
  const selected = (name) => form.querySelector(`[name="${name}"]:checked`)?.value || '';
  const isPersonalized = () => selected('personalization') === 'yes';
  const selectedFlags = () => Array.from(flagsInput?.selectedOptions || []).map((option) => option.value);
  const quantity = () => Math.max(1, Math.floor(Number(qtyInput?.value || 1)));

  function initializeGallery() {
    const gallery = document.querySelector('.top-product-media');
    if (!gallery || !product.gallery?.length) return;
    Promise.all(product.gallery.map((src) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ src, available: true });
      image.onerror = () => resolve({ src, available: false });
      image.src = src;
    }))).then((images) => {
      const available = images.filter((image) => image.available);
      if (!available.length) return;
      gallery.innerHTML = `<button type="button" class="product-gallery-main" data-top-gallery-main aria-label="Ampliar imagen de TOP PICKLEMANIA"><img src="${available[0].src}" alt="TOP PICKLEMANIA — tops blanco y negro juntos" class="w-full h-full object-contain"></button><div class="product-gallery-thumbs">${available.map((image, index) => `<button type="button" data-top-gallery-image="${image.src}" aria-pressed="${index === 0}"><img src="${image.src}" alt=""></button>`).join('')}</div>`;
      const mainImage = gallery.querySelector('img');
      gallery.querySelectorAll('[data-top-gallery-image]').forEach((button) => button.addEventListener('click', () => {
        mainImage.src = button.dataset.topGalleryImage;
        gallery.querySelectorAll('[data-top-gallery-image]').forEach((thumb) => thumb.setAttribute('aria-pressed', String(thumb === button)));
      }));
    });
  }

  function priceCents() { return product.price + (isPersonalized() ? product.personalizationPrice : 0); }
  function syncPersonalization() {
    const visible = isPersonalized();
    nameWrap?.classList.toggle('hidden', !visible);
    nameInput?.toggleAttribute('required', visible);
    flagsInput?.toggleAttribute('required', visible);
    if (!visible) {
      if (nameInput) nameInput.value = '';
      if (flagsInput) Array.from(flagsInput.options).forEach((option) => { option.selected = false; });
    }
    priceNode.textContent = formatPrice(priceCents());
  }

  function configuration() {
    const personalized = isPersonalized();
    return {
      color: selected('color'),
      size: selected('size'),
      personalized,
      personalizationName: personalized ? nameInput.value.trim() : '',
      flags: personalized ? selectedFlags() : []
    };
  }

  function validate(config) {
    if (!product.colors.includes(config.color)) return 'Selecciona un color.';
    if (product.sizes.length && !product.sizes.includes(config.size)) return 'Selecciona una talla.';
    if (config.personalized && !config.personalizationName) return 'Escribe el nombre para la personalización.';
    if (config.personalized && !config.flags.length) return 'Selecciona al menos una bandera.';
    return '';
  }

  function summary(config) {
    const lines = [`Color: ${config.color}`, `Talla: ${config.size}`];
    if (config.personalized) {
      lines.push('Personalización: Sí (+5€)', `Nombre: ${config.personalizationName}`, `Bandera${config.flags.length > 1 ? 's' : ''}: ${config.flags.join(', ')}`);
    } else {
      lines.push('Personalización: Sin personalización');
    }
    return lines.join('\n');
  }

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.remove('opacity-0', 'text-green-700', 'text-red-700');
    feedback.classList.add(isError ? 'text-red-700' : 'text-green-700');
    if (!isError) window.setTimeout(() => feedback.classList.add('opacity-0'), 1800);
  }

  function add() {
    const config = configuration();
    const error = validate(config);
    if (error) { showFeedback(error, true); return false; }
    const cents = priceCents();
    const configurationKey = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    window.PicklemaniaCart?.addToCart({
      ...product,
      image: product.image || '',
      cartKey: `${product.id}:${configurationKey}`,
      price: cents / 100,
      unitAmount: cents,
      displayPrice: formatPrice(cents),
      configuration: config,
      configurationSummary: summary(config),
      quantity: quantity()
    });
    showFeedback('Producto añadido al carrito', false);
    return true;
  }

  form.querySelectorAll('[name="personalization"]').forEach((node) => node.addEventListener('change', syncPersonalization));
  form.querySelector('.add-to-cart-btn')?.addEventListener('click', add);
  form.querySelector('.buy-now-btn')?.addEventListener('click', () => { if (add()) window.location.href = window.PicklemaniaUrl?.cleanUrl('carrito') || 'carrito'; });
  syncPersonalization();
  initializeGallery();
});
