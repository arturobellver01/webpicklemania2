document.addEventListener('DOMContentLoaded', () => {
  const itemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartContent = document.getElementById('cart-content');
  const totalNode = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutStatus = document.getElementById('checkout-status');

  const formatPrice = (value) => `${value.toFixed(2).replace('.', ',')}€`;

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

    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    totalNode.textContent = formatPrice(total);
    window.PicklemaniaCart?.updateCartBadge();
  };

  itemsContainer.addEventListener('click', (event) => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const productId = target.dataset.id;
    const cart = window.PicklemaniaCart?.getCart() || [];
    const current = cart.find((item) => item.id === productId);
    if (!current) return;

    if (action === 'increase') {
      window.PicklemaniaCart.updateQuantity(productId, current.quantity + 1);
    }

    if (action === 'decrease') {
      window.PicklemaniaCart.updateQuantity(productId, current.quantity - 1);
    }

    if (action === 'remove') {
      window.PicklemaniaCart.removeFromCart(productId);
    }

    render();
  });

  checkoutBtn?.addEventListener('click', async () => {
    const cart = window.PicklemaniaCart?.getCart() || [];

    if (!cart.length) {
      checkoutStatus.textContent = 'Tu carrito está vacío.';
      return;
    }

    checkoutStatus.textContent = 'Redirigiendo a Stripe Checkout...';

    try {
      const response = await fetch('/crear-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'No se pudo iniciar el checkout');
      }

      window.location.href = data.url;
    } catch (error) {
      checkoutStatus.textContent = error.message || 'Error iniciando checkout.';
    }
  });

  render();
});
