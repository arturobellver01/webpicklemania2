require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:5500';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRODUCT_PRICE_MAP = {
  'picklemania-black-paddle': process.env.STRIPE_PRICE_BLACK_PADDLE,
  'picklemania-white-paddle': process.env.STRIPE_PRICE_WHITE_PADDLE
};

const SHIPPING_ZONES = {
  ES: { threshold: 6000, paid: process.env.STRIPE_SHIPPING_ES, free: process.env.STRIPE_SHIPPING_ES_FREE },
  CANARIAS: { threshold: null, paid: process.env.STRIPE_SHIPPING_CANARIAS, free: null },
  EU_1: { threshold: 13000, paid: process.env.STRIPE_SHIPPING_EU_1, free: process.env.STRIPE_SHIPPING_EU_1_FREE },
  EU_2: { threshold: 18000, paid: process.env.STRIPE_SHIPPING_EU_2, free: process.env.STRIPE_SHIPPING_EU_2_FREE }
};

app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));
app.use(express.json());

function buildShippingOptions(shippingZone, subtotalCents) {
  const zone = SHIPPING_ZONES[shippingZone];
  if (!zone) throw new Error('Zona de envío no válida.');

  if (shippingZone === 'CANARIAS') {
    if (!zone.paid) throw new Error('Shipping rate de Canarias no configurado.');
    return [{ shipping_rate: zone.paid }];
  }

  const options = [];
  if (zone.paid) options.push({ shipping_rate: zone.paid });
  if (zone.free && typeof zone.threshold === 'number' && subtotalCents >= zone.threshold) {
    options.push({ shipping_rate: zone.free });
  }

  if (!options.length) throw new Error(`No hay opciones de envío configuradas para ${shippingZone}.`);
  return options;
}

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, shippingZone } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos un producto.' });
    }

    const line_items = items.map((item) => {
      const productId = item?.productId;
      const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
      const price = PRODUCT_PRICE_MAP[productId];

      if (!price) throw new Error(`Producto no configurado en Stripe: ${productId}`);
      return { price, quantity };
    });

    const subtotalCents = line_items.reduce((sum, line) => sum + ((line.quantity || 0) * 9000), 0);
    const shipping_options = buildShippingOptions(shippingZone || 'ES', subtotalCents);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_options,
      shipping_address_collection: {
        allowed_countries: ['ES', 'PT', 'FR', 'IT', 'DE', 'BE', 'NL', 'AT', 'PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI']
      },
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/cancel.html`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'No se pudo crear la sesión' });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(port, () => console.log(`Backend Stripe en puerto ${port}`));
