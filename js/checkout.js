(function () {
  const CHECKOUT_ENDPOINT = '/api/create-checkout-session.php';

  const SUPPORTED_COUNTRIES = ['ES', 'FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT', 'PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];
  const EU_GROUP_1 = ['FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT'];
  const EU_GROUP_2 = ['PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];

  function normalizePostalCode(postalCode) {
    return String(postalCode || '').trim().replace(/\s+/g, '');
  }

  function detectShippingZone(country, postalCode, subtotal) {
    const normalizedCountry = String(country || '').toUpperCase();
    const normalizedPostal = normalizePostalCode(postalCode);
    const subtotalValue = Number(subtotal) || 0;

    if (!SUPPORTED_COUNTRIES.includes(normalizedCountry)) {
      return {
        supported: false,
        zone: null,
        shipping: 0,
        freeShipping: false,
        message: 'Actualmente no enviamos a este país.',
        remainingForFree: null
      };
    }

    if (normalizedCountry === 'ES') {
      const prefix2 = normalizedPostal.slice(0, 2);

      if (prefix2 === '35' || prefix2 === '38') {
        return {
          supported: true,
          zone: 'CANARIAS',
          shipping: 19.95,
          freeShipping: false,
          message: 'Envío Canarias: 19,95 €',
          remainingForFree: null
        };
      }

      const shipping = subtotalValue >= 60 ? 0 : 4.95;
      const freeShipping = shipping === 0;
      const remainingForFree = freeShipping ? 0 : Math.max(0, 60 - subtotalValue);

      return {
        supported: true,
        zone: 'ES',
        shipping,
        freeShipping,
        message: freeShipping ? 'Envío gratis aplicado' : 'Envío España y Baleares: 4,95 €',
        remainingForFree
      };
    }

    if (EU_GROUP_1.includes(normalizedCountry)) {
      const shipping = subtotalValue >= 130 ? 0 : 14.95;
      const freeShipping = shipping === 0;
      const remainingForFree = freeShipping ? 0 : Math.max(0, 130 - subtotalValue);

      return {
        supported: true,
        zone: 'EU_1',
        shipping,
        freeShipping,
        message: freeShipping ? 'Envío gratis aplicado' : 'Envío Europa Grupo 1: 14,95 €',
        remainingForFree
      };
    }

    if (EU_GROUP_2.includes(normalizedCountry)) {
      const shipping = subtotalValue >= 180 ? 0 : 19.95;
      const freeShipping = shipping === 0;
      const remainingForFree = freeShipping ? 0 : Math.max(0, 180 - subtotalValue);

      return {
        supported: true,
        zone: 'EU_2',
        shipping,
        freeShipping,
        message: freeShipping ? 'Envío gratis aplicado' : 'Envío Europa Grupo 2: 19,95 €',
        remainingForFree
      };
    }

    return {
      supported: false,
      zone: null,
      shipping: 0,
      freeShipping: false,
      message: 'Actualmente no enviamos a este país.',
      remainingForFree: null
    };
  }

  async function createCheckout(items, customer) {
    const normalizedItems = (Array.isArray(items) ? items : [])
      .map((item) => ({
        productId: item?.id || item?.productId,
        quantity: Math.max(1, Math.floor(Number(item?.quantity || 1)))
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (!normalizedItems.length) throw new Error('No hay productos válidos para pagar.');

    const endpoint = CHECKOUT_ENDPOINT;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: normalizedItems, customer })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      console.error('Stripe checkout request failed', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        response: data,
        payload: { items: normalizedItems, customer }
      });
      throw new Error(data.error || 'No se pudo iniciar Stripe Checkout. Revisa los datos de envío e inténtalo de nuevo.');
    }

    window.location.href = data.url;
  }

  window.PicklemaniaCheckout = { createCheckout, detectShippingZone, SUPPORTED_COUNTRIES };
})();
