(function () {
  const STORAGE_KEY = 'picklemania_cart';

  const formatCount = (count) => (count > 99 ? '99+' : String(count));

  function normalizeCart(cart) {
    const normalized = Array.isArray(cart) ? cart : [];
    return normalized.map((item) => {
      if (item?.id === 'pala-black-white') {
        return {
          ...item,
          id: 'picklemania-black-paddle',
          name: item.name === 'Black & White Paddle' ? 'Picklemania Black Paddle' : (item.name || 'Picklemania Black Paddle')
        };
      }
      return item;
    });
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return normalizeCart(parsed);
    } catch (error) {
      console.warn('No se pudo leer el carrito:', error);
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
    updateCartBadge();
  }

  function addToCart(product) {
    if (!product || !product.id) return;

    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    const quantityToAdd = Number(product.quantity) > 0 ? Math.floor(Number(product.quantity)) : 1;

    if (existing) {
      existing.quantity += quantityToAdd;
      existing.stripePriceId = product.stripePriceId || existing.stripePriceId;
    } else {
      cart.push({
        ...product,
        quantity: quantityToAdd
      });
    }

    saveCart(cart);
  }

  function removeFromCart(productId) {
    const cart = getCart().filter((item) => item.id !== productId);
    saveCart(cart);
  }

  function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;

    const nextQuantity = Number(quantity);

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    item.quantity = Math.floor(nextQuantity);
    saveCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    updateCartBadge();
  }

  function getCartCount() {
    return getCart().reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }

  function updateCartBadge() {
    const count = getCartCount();
    [document.getElementById('cart-count'), document.getElementById('cart-count-mobile')].forEach((badge) => {
      if (!badge) return;
      badge.textContent = formatCount(count);
      badge.classList.toggle('hidden', count === 0);
    });
  }

  window.PicklemaniaCart = {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    updateCartBadge
  };

  document.addEventListener('DOMContentLoaded', updateCartBadge);
})();
