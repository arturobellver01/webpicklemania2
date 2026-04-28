document.addEventListener('DOMContentLoaded', () => {
  const quantityInput = document.getElementById('product-quantity');
  const decreaseBtn = document.getElementById('qty-decrease');
  const increaseBtn = document.getElementById('qty-increase');
  const addBtn = document.querySelector('.add-to-cart-btn[data-product]');
  const buyNowBtn = document.querySelector('.buy-now-btn[data-product]');

  const getQty = () => {
    const value = Number(quantityInput?.value || 1);
    if (!Number.isFinite(value) || value < 1) return 1;
    return Math.floor(value);
  };

  const setQty = (value) => {
    if (!quantityInput) return;
    quantityInput.value = Math.max(1, Math.floor(Number(value) || 1));
  };

  decreaseBtn?.addEventListener('click', () => setQty(getQty() - 1));
  increaseBtn?.addEventListener('click', () => setQty(getQty() + 1));
  quantityInput?.addEventListener('change', () => setQty(getQty()));

  const addProductWithQuantity = (button) => {
    if (!button || !window.PicklemaniaCart) return null;
    const productId = button.dataset.product;
    const configuredProduct = window.PicklemaniaProducts?.getById(productId);
    if (!configuredProduct) return null;

    window.PicklemaniaCart.addToCart({
      id: configuredProduct.id,
      name: configuredProduct.name,
      description: configuredProduct.description,
      price: configuredProduct.price / 100,
      unitAmount: configuredProduct.price,
      displayPrice: configuredProduct.displayPrice,
      image: configuredProduct.id === 'picklemania-white-paddle' ? 'img/pala-1.png' : configuredProduct.image,
      stripePriceId: configuredProduct.stripePriceId,
      category: configuredProduct.category,
      type: configuredProduct.type,
      quantity: getQty()
    });
    window.PicklemaniaCart.updateCartBadge();
    return configuredProduct.id;
  };

  addBtn?.addEventListener('click', () => {
    const productId = addProductWithQuantity(addBtn);
    if (!productId) return;
    const feedback = document.querySelector(`[data-feedback="${productId}"]`);
    if (!feedback) return;
    feedback.textContent = 'Producto añadido al carrito';
    feedback.classList.remove('opacity-0');
    window.setTimeout(() => feedback.classList.add('opacity-0'), 1400);
  });

  buyNowBtn?.addEventListener('click', () => {
    const productId = addProductWithQuantity(buyNowBtn);
    if (!productId) return;

    buyNowBtn.disabled = true;
    buyNowBtn.textContent = 'Procesando...';
    const feedback = document.querySelector(`[data-feedback="${productId}"]`);
    if (feedback) {
      feedback.textContent = 'Redirigiendo al carrito...';
      feedback.classList.remove('opacity-0');
    }

    window.setTimeout(() => {
      window.location.href = 'carrito.html';
    }, 350);
  });
});
