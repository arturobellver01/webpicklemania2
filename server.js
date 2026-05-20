require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static('.'));

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Falta STRIPE_SECRET_KEY en variables de entorno.');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRODUCT_PRICE_MAP = {
  'picklemania-black-paddle': process.env.STRIPE_PRICE_BLACK_PADDLE,
  'picklemania-white-paddle': process.env.STRIPE_PRICE_WHITE_PADDLE
};

const SHIPPING = {
  es: process.env.STRIPE_SHIPPING_ES,
  esFree: process.env.STRIPE_SHIPPING_ES_FREE,
  canarias: process.env.STRIPE_SHIPPING_CANARIAS,
  eu1: process.env.STRIPE_SHIPPING_EU_1,
  eu1Free: process.env.STRIPE_SHIPPING_EU_1_FREE,
  eu2: process.env.STRIPE_SHIPPING_EU_2,
  eu2Free: process.env.STRIPE_SHIPPING_EU_2_FREE
};

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Debes enviar items con productId y quantity.' });
    }

    const line_items = items.map(({ productId, quantity }) => {
      const price = PRODUCT_PRICE_MAP[productId];
      const qty = Math.max(1, Math.floor(Number(quantity || 1)));
      if (!price) throw new Error(`Producto no configurado: ${productId}`);
      return { price, quantity: qty };
    });

    const subtotalCents = items.reduce((acc, item) => acc + ((Number(item.quantity) || 1) * 9000), 0);
    const shipping_options = [
      SHIPPING.es && { shipping_rate: SHIPPING.es },
      subtotalCents >= 6000 && SHIPPING.esFree && { shipping_rate: SHIPPING.esFree },
      SHIPPING.canarias && { shipping_rate: SHIPPING.canarias },
      SHIPPING.eu1 && { shipping_rate: SHIPPING.eu1 },
      subtotalCents >= 13000 && SHIPPING.eu1Free && { shipping_rate: SHIPPING.eu1Free },
      SHIPPING.eu2 && { shipping_rate: SHIPPING.eu2 },
      subtotalCents >= 18000 && SHIPPING.eu2Free && { shipping_rate: SHIPPING.eu2Free }
    ].filter(Boolean);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES', 'FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT', 'PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI']
      },
      shipping_options,
      success_url: `${DOMAIN}/success.html`,
      cancel_url: `${DOMAIN}/cancel.html`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando checkout:', error);
    return res.status(500).json({ error: error.message || 'No se pudo crear la sesión de checkout.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor Picklemania listo en ${DOMAIN} (puerto ${port})`);
});
