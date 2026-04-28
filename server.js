require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Falta STRIPE_SECRET_KEY en variables de entorno.');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const YOUR_DOMAIN = process.env.YOUR_DOMAIN || 'http://localhost:3000';

app.use(express.json());
app.use(express.static('.'));

app.post('/crear-checkout', async (req, res) => {
  try {
    const { cart } = req.body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Carrito inválido o vacío.' });
    }

    const lineItems = cart
      .filter((item) => item?.stripePriceId && Number(item?.quantity) > 0)
      .map((item) => ({
        price: item.stripePriceId, // Reemplaza estos price_id placeholder por los reales de Stripe.
        quantity: Math.floor(Number(item.quantity))
      }));

    if (!lineItems.length) {
      return res.status(400).json({ error: 'No hay line_items válidos en el carrito.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/carrito.html`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando checkout:', error);
    return res.status(500).json({ error: 'No se pudo crear la sesión de checkout.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor Picklemania listo en ${YOUR_DOMAIN} (puerto ${port})`);
});
