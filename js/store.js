document.addEventListener('DOMContentLoaded', () => {
  const addButtons = document.querySelectorAll('.add-to-cart-btn[data-product]');
  const buyNowButtons = document.querySelectorAll('.buy-now-btn[data-product]');

  const normalizeProduct = (button, quantity = 1) => {
    const productId = button.dataset.product;
    const configuredProduct = window.PicklemaniaProducts?.getById(productId);

    const fallbackPrice = Number(button.dataset.price) || 0;
    const centPrice = configuredProduct?.price || Math.round(fallbackPrice * 100);

    return {
      id: configuredProduct?.id || productId,
      name: configuredProduct?.name || button.dataset.name,
      description: configuredProduct?.description || button.dataset.description || '',
      price: centPrice / 100,
      unitAmount: centPrice,
      displayPrice: configuredProduct?.displayPrice || button.dataset.displayPrice || `${(centPrice / 100).toFixed(2)}€`,
      image: button.dataset.image || configuredProduct?.image,
      stripePriceId: configuredProduct?.stripePriceId || button.dataset.stripePriceId || '',
      category: configuredProduct?.category || button.dataset.category || 'paddle',
      type: configuredProduct?.type || button.dataset.type || 'paddle',
      quantity: Number(quantity) > 0 ? Number(quantity) : 1
    };
  };

  const showFeedback = (productId, message) => {
    const feedback = document.querySelector(`[data-feedback="${productId}"]`);
    if (!feedback) return;

    if (message) {
      feedback.textContent = message;
    }

    feedback.classList.remove('opacity-0');
    setTimeout(() => {
      feedback.classList.add('opacity-0');
    }, 1400);
  };

  const getQuantityFromButton = (button) => {
    const quantityInputSelector = button.dataset.quantityInput;
    if (!quantityInputSelector) return 1;

    const input = document.querySelector(quantityInputSelector);
    const quantity = Number(input?.value || 1);
    return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
  };

  const addProduct = (button, quantity = 1) => {
    const product = normalizeProduct(button, quantity);
    if (!window.PicklemaniaCart) return product;

    window.PicklemaniaCart.addToCart(product);
    window.PicklemaniaCart.updateCartBadge();
    return product;
  };

  addButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const quantity = getQuantityFromButton(button);
      const product = addProduct(button, quantity);
      showFeedback(product.id, 'Producto añadido al carrito');
    });
  });

  buyNowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const quantity = getQuantityFromButton(button);
      button.disabled = true;
      button.dataset.originalText = button.dataset.originalText || button.textContent;
      button.textContent = 'Procesando...';

      const product = addProduct(button, quantity);
      showFeedback(product.id, 'Redirigiendo al carrito...');

      window.setTimeout(() => {
        window.location.href = 'carrito.html';
      }, 350);
    });
  });
});
