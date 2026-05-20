(function () {
  const API_BASE = window.PICKLEMANIA_API_BASE || (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://www.picklemaniaweb.es');

  const STORAGE_KEY = 'picklemania_shipping_zone';

  function getShippingZone() {
    const selected = localStorage.getItem(STORAGE_KEY) || 'ES';
    return ['ES', 'CANARIAS', 'EU_1', 'EU_2'].includes(selected) ? selected : 'ES';
  }

  function setShippingZone(zone) {
    const safeZone = ['ES', 'CANARIAS', 'EU_1', 'EU_2'].includes(zone) ? zone : 'ES';
    localStorage.setItem(STORAGE_KEY, safeZone);
    return safeZone;
  }

  async function createCheckout(items, options = {}) {
    const normalizedItems = (Array.isArray(items) ? items : [])
      .map((item) => ({
        productId: item?.id || item?.productId,
        quantity: Math.max(1, Math.floor(Number(item?.quantity || 1)))
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (!normalizedItems.length) throw new Error('No hay productos válidos para pagar.');

    const shippingZone = setShippingZone(options.shippingZone || getShippingZone());

    const response = await fetch(`${API_BASE}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: normalizedItems, shippingZone })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar Stripe Checkout.');

    window.location.href = data.url;
  }

  window.PicklemaniaCheckout = { createCheckout, getShippingZone, setShippingZone };
})();
