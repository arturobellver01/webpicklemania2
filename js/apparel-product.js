document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-apparel-product]');
  if (!form) return;

  const productId = form.dataset.apparelProduct;
  const product = window.PicklemaniaProducts?.getById(productId);
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
      : [`Modelo: ${editionLabel[config.edition]}`, `Talla: ${config.size}`];
    if (product.allowsPersonalization) lines.push(config.personalizationName ? `Personalización: ${config.personalizationName} (+5€)` : 'Personalización: Sin personalización');
    return lines.join('\n');
  }
  function priceCents(config) { return Number(product.price) + (config.personalizationName ? 500 : 0); }
  function validate(config) {
    if (!Number.isFinite(Number(product.price)) || product.price === null) return 'El precio de este producto está pendiente de configuración.';
    if (Object.entries(config).some(([key, value]) => key !== 'personalizationName' && value === '')) return 'Selecciona todas las opciones antes de continuar.';
    return '';
  }
  function add() {
    const config = buildConfiguration();
    const error = validate(config);
    if (error) { feedback.textContent = error; feedback.classList.remove('opacity-0', 'text-green-700'); feedback.classList.add('text-red-700'); return false; }
    const cents = priceCents(config);
    const configurationKey = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    const cartKey = `${product.id}:${configurationKey}`;
    window.PicklemaniaCart?.addToCart({ ...product, cartKey, price: cents / 100, unitAmount: cents, displayPrice: `${(cents / 100).toFixed(2).replace('.', ',')}€`, configuration: config, configurationSummary: configurationSummary(config), quantity: quantity() });
    feedback.textContent = 'Producto añadido al carrito'; feedback.classList.remove('opacity-0', 'text-red-700'); feedback.classList.add('text-green-700');
    window.setTimeout(() => feedback.classList.add('opacity-0'), 1800);
    return true;
  }
  form.querySelectorAll('[name="personalization"]').forEach((node) => node.addEventListener('change', syncPersonalization));
  form.querySelector('.add-to-cart-btn')?.addEventListener('click', add);
  form.querySelector('.buy-now-btn')?.addEventListener('click', () => { if (add()) window.location.href = window.PicklemaniaUrl?.cleanUrl('carrito') || 'carrito'; });
  if (Number.isFinite(Number(product?.price)) && product?.price !== null) priceNode.textContent = product.displayPrice;
  syncPersonalization();
});
