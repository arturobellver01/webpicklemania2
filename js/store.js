document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.add-to-cart-btn');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const product = {
        id: button.dataset.productId,
        name: button.dataset.name,
        description: button.dataset.description,
        price: Number(button.dataset.price),
        image: button.dataset.image,
        stripePriceId: button.dataset.stripePriceId,
        quantity: 1
      };

      if (!window.PicklemaniaCart) return;

      window.PicklemaniaCart.addToCart(product);
      window.PicklemaniaCart.updateCartBadge();

      const feedback = document.querySelector(`[data-feedback="${product.id}"]`);
      if (!feedback) return;

      feedback.classList.remove('opacity-0');
      setTimeout(() => {
        feedback.classList.add('opacity-0');
      }, 1200);
    });
  });
});
