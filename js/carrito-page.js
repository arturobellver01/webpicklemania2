document.addEventListener('DOMContentLoaded', () => {
  const itemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartContent = document.getElementById('cart-content');
  const subtotalNode = document.getElementById('cart-subtotal');
  const shippingNode = document.getElementById('cart-shipping');
  const totalNode = document.getElementById('cart-total');
  const shippingMessageNode = document.getElementById('shipping-message');
  const shippingGapNode = document.getElementById('shipping-gap');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutStatus = document.getElementById('checkout-status');

  const countryNode = document.getElementById('customer-country');
  const nameNode = document.getElementById('customer-name');
  const addressNode = document.getElementById('customer-address');
  const postalNode = document.getElementById('customer-postal');
  const cityNode = document.getElementById('customer-city');
  const stateNode = document.getElementById('customer-state');
  const phoneNode = document.getElementById('customer-phone');
  const emailNode = document.getElementById('customer-email');

  const formatPrice = (value) => `${(Number(value) || 0).toFixed(2).replace('.', ',')}€`;

  function getSubtotal(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  }

  function requiredFieldsValid() {
    const requiredFields = [countryNode, nameNode, addressNode, postalNode, cityNode, stateNode, phoneNode, emailNode];
    return requiredFields.every((field) => field && String(field.value || '').trim().length > 0);
  }

  function buildCustomerPayload() {
    return {
      name: String(nameNode?.value || '').trim(),
      email: String(emailNode?.value || '').trim(),
      phone: String(phoneNode?.value || '').trim(),
      address: {
        line1: String(addressNode?.value || '').trim(),
        postal_code: String(postalNode?.value || '').trim(),
        city: String(cityNode?.value || '').trim(),
        state: String(stateNode?.value || '').trim(),
        country: String(countryNode?.value || '').trim().toUpperCase()
      }
    };
  }

  const render = () => {
    const cart = window.PicklemaniaCart?.getCart() || [];

    if (!cart.length) {
      emptyCart.classList.remove('hidden');
      cartContent.classList.add('hidden');
      window.PicklemaniaCart?.updateCartBadge();
      return;
    }

    emptyCart.classList.add('hidden');
    cartContent.classList.remove('hidden');

    itemsContainer.innerHTML = cart.map((item) => {
      const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return `
        <article class="card-soft p-4 md:p-6">
          <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
            <img src="${item.image}" alt="${item.name}" class="w-full sm:w-28 h-28 object-cover rounded-2xl bg-brand-light p-2">
            <div class="flex-1">
              <h2 class="font-display font-bold text-xl">${item.name}</h2>
              <p class="text-brand-gray text-sm mb-2">${item.description || ''}</p>
              <p class="text-sm text-brand-gray">Precio: ${formatPrice(Number(item.price) || 0)}</p>
              <p class="text-sm font-semibold">Subtotal: ${formatPrice(subtotal)}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-secondary !px-3 !py-2" data-action="decrease" data-id="${item.id}" aria-label="Reducir cantidad">-</button>
              <span class="min-w-8 text-center font-semibold">${item.quantity}</span>
              <button class="btn-secondary !px-3 !py-2" data-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
            </div>
            <button class="text-sm font-semibold underline" data-action="remove" data-id="${item.id}">Eliminar</button>
          </div>
        </article>`;
    }).join('');

    updateCartTotals();
    window.PicklemaniaCart?.updateCartBadge();
  };

  function updateCartTotals() {
    const cart = window.PicklemaniaCart?.getCart() || [];
    const subtotal = getSubtotal(cart);
    const country = countryNode?.value;
    const postal = postalNode?.value;

    const shippingEstimate = window.PicklemaniaCheckout?.detectShippingZone(country, postal, subtotal);

    const shipping = shippingEstimate?.supported ? Number(shippingEstimate.shipping || 0) : 0;
    const total = subtotal + shipping;

    subtotalNode.textContent = formatPrice(subtotal);
    shippingNode.textContent = shippingEstimate?.supported ? formatPrice(shipping) : '-';
    totalNode.textContent = formatPrice(total);

    shippingMessageNode.textContent = shippingEstimate?.message || '';

    if (shippingEstimate?.supported && !shippingEstimate.freeShipping && typeof shippingEstimate.remainingForFree === 'number' && shippingEstimate.remainingForFree > 0) {
      shippingGapNode.textContent = `Te faltan ${formatPrice(shippingEstimate.remainingForFree)} para envío gratis`;
    } else {
      shippingGapNode.textContent = '';
    }

    const validForm = requiredFieldsValid();
    const canCheckout = cart.length > 0 && shippingEstimate?.supported && validForm;
    checkoutBtn.disabled = !canCheckout;

    if (!shippingEstimate?.supported && country) {
      checkoutStatus.textContent = 'Actualmente no enviamos a este país.';
    } else if (!validForm) {
      checkoutStatus.textContent = 'Completa todos los campos de envío para continuar.';
    } else {
      checkoutStatus.textContent = '';
    }
  }

  itemsContainer.addEventListener('click', (event) => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const productId = target.dataset.id;
    const cart = window.PicklemaniaCart?.getCart() || [];
    const current = cart.find((item) => item.id === productId);
    if (!current) return;

    if (action === 'increase') window.PicklemaniaCart.updateQuantity(productId, current.quantity + 1);
    if (action === 'decrease') window.PicklemaniaCart.updateQuantity(productId, current.quantity - 1);
    if (action === 'remove') window.PicklemaniaCart.removeFromCart(productId);

    render();
  });

  [countryNode, nameNode, addressNode, postalNode, cityNode, stateNode, phoneNode, emailNode].forEach((node) => {
    node?.addEventListener('input', updateCartTotals);
    node?.addEventListener('change', updateCartTotals);
  });

  checkoutBtn?.addEventListener('click', async () => {
    const cart = window.PicklemaniaCart?.getCart() || [];
    if (!cart.length) {
      checkoutStatus.textContent = 'Tu carrito está vacío.';
      return;
    }

    updateCartTotals();
    if (checkoutBtn.disabled) return;

    checkoutStatus.textContent = 'Redirigiendo a Stripe Checkout...';

    try {
      if (!window.PicklemaniaCheckout) throw new Error('Checkout no disponible.');
      await window.PicklemaniaCheckout.createCheckout(
        cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        buildCustomerPayload()
      );
    } catch (error) {
      console.error('Error iniciando checkout', {
        message: error?.message,
        stack: error?.stack,
        cart,
        customer: buildCustomerPayload()
      });
      checkoutStatus.textContent = error.message || 'Error iniciando checkout.';
    }
  });

  render();
});
