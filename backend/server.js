require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:5500';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRODUCT_PRICE_MAP = {
  'picklemania-black-paddle': process.env.STRIPE_PRICE_BLACK_PADDLE,
  'picklemania-white-paddle': process.env.STRIPE_PRICE_WHITE_PADDLE,
  'picklemania-superpibes-kit': process.env.STRIPE_PRICE_SUPERPIBES_KIT
};

const PRODUCT_PRICE_EUR = {
  'picklemania-black-paddle': 90,
  'picklemania-white-paddle': 90,
  'picklemania-superpibes-shirt': 29.90,
  'picklemania-superpibes-pants': 34.90,
  'picklemania-superpibes-kit': 59.90
};

const SHIPPING_ZONES = {
  ES: { threshold: 60, paid: process.env.STRIPE_SHIPPING_ES, free: process.env.STRIPE_SHIPPING_ES_FREE, cost: 4.95 },
  CANARIAS: { threshold: null, paid: process.env.STRIPE_SHIPPING_CANARIAS, free: null, cost: 19.95 },
  EU_1: { threshold: 130, paid: process.env.STRIPE_SHIPPING_EU_1, free: process.env.STRIPE_SHIPPING_EU_1_FREE, cost: 14.95 },
  EU_2: { threshold: 180, paid: process.env.STRIPE_SHIPPING_EU_2, free: process.env.STRIPE_SHIPPING_EU_2_FREE, cost: 19.95 }
};

const ALLOWED_COUNTRIES = ['ES', 'PT', 'FR', 'IT', 'DE', 'BE', 'NL', 'AT', 'PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];
const EU_GROUP_1 = ['FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT'];
const EU_GROUP_2 = ['PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://picklemaniaweb.es',
  'https://www.picklemaniaweb.es'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  }
}));
app.use(express.json());

function detectShippingZone(country, postalCode = '') {
  const c = String(country || '').toUpperCase();
  const p = String(postalCode || '').trim().replace(/\s+/g, '');

  if (c === 'ES') {
    const prefix = p.slice(0, 2);
    if (prefix === '35' || prefix === '38') return 'CANARIAS';
    return 'ES';
  }

  if (EU_GROUP_1.includes(c)) return 'EU_1';
  if (EU_GROUP_2.includes(c)) return 'EU_2';
  return null;
}

function getShippingRateId(zoneName, subtotal) {
  const zone = SHIPPING_ZONES[zoneName];
  if (!zone) throw new Error('Zona de envío no soportada.');

  if (zoneName === 'CANARIAS') {
    if (!zone.paid) throw new Error('Shipping rate de Canarias no configurado.');
    return zone.paid;
  }

  if (typeof zone.threshold === 'number' && subtotal >= zone.threshold && zone.free) return zone.free;
  if (!zone.paid) throw new Error(`Shipping rate no configurado para ${zoneName}.`);
  return zone.paid;
}

function superpibesPriceFor(productId, configuration) {
  if (productId === 'picklemania-superpibes-shirt') {
    return configuration.edition === 'pro' ? process.env.STRIPE_PRICE_SUPERPIBES_SHIRT_PRO : process.env.STRIPE_PRICE_SUPERPIBES_SHIRT_COMPETITION;
  }
  if (productId === 'picklemania-superpibes-pants') {
    return configuration.edition === 'pro' ? process.env.STRIPE_PRICE_SUPERPIBES_PANTS_PRO : process.env.STRIPE_PRICE_SUPERPIBES_PANTS_COMPETITION;
  }
  return PRODUCT_PRICE_MAP[productId];
}


const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_COURTS_TABLE = process.env.SUPABASE_COURTS_TABLE || 'pickleball_courts';

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Supabase no configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || 'Error consultando Supabase');
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

app.get('/courts', async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const south = Number(req.query.south);
    const west = Number(req.query.west);
    const north = Number(req.query.north);
    const east = Number(req.query.east);
    const params = new URLSearchParams({ select: '*', status: `eq.${status}`, order: 'created_at.desc' });
    if ([south, west, north, east].every(Number.isFinite)) {
      params.append('lat', `gte.${south}`); params.append('lat', `lte.${north}`);
      params.append('lng', `gte.${west}`); params.append('lng', `lte.${east}`);
    }
    const courts = await supabaseRequest(`${SUPABASE_COURTS_TABLE}?${params}`);
    res.json(courts);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post('/courts', async (req, res) => {
  try {
    const body = req.body || {};
    const court = {
      name: String(body.name || '').trim(),
      address: String(body.address || '').trim(),
      court_count: Math.max(1, Number(body.court_count || 1)),
      surface_type: ['indoor', 'outdoor'].includes(body.surface_type) ? body.surface_type : 'outdoor',
      access_type: ['public', 'private'].includes(body.access_type) ? body.access_type : 'public',
      price_type: ['free', 'paid'].includes(body.price_type) ? body.price_type : 'paid',
      opening_hours: String(body.opening_hours || '').trim(),
      website: String(body.website || '').trim(),
      description: String(body.description || '').trim(),
      lat: Number(body.lat),
      lng: Number(body.lng),
      source: 'picklemania',
      status: 'pending'
    };
    if (!court.name || !court.address || !Number.isFinite(court.lat) || !Number.isFinite(court.lng)) {
      return res.status(400).json({ error: 'Nombre, dirección y coordenadas son obligatorios.' });
    }
    const inserted = await supabaseRequest(SUPABASE_COURTS_TABLE, { method: 'POST', body: JSON.stringify(court) });
    res.status(201).json(inserted?.[0] || court);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, customer } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos un producto.' });
    }

    if (!customer?.address?.country || !customer?.address?.postal_code || !customer?.name || !customer?.email || !customer?.phone || !customer?.address?.line1 || !customer?.address?.city || !customer?.address?.state) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del cliente o dirección.' });
    }

    const country = String(customer.address.country).toUpperCase();
    if (!ALLOWED_COUNTRIES.includes(country)) {
      return res.status(400).json({ error: 'Actualmente no enviamos a este país.' });
    }

    const configurations = [];
    const editions = ['pro', 'competition'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const line_items = items.flatMap((item) => {
      const productId = String(item?.productId || '');
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Cantidad no válida.');
      const config = item?.configuration || {};
      const isKit = productId === 'picklemania-superpibes-kit';
      const validConfig = !String(productId || '').startsWith('picklemania-superpibes-') || (isKit
        ? editions.includes(config.shirtEdition) && editions.includes(config.pantsEdition) && sizes.includes(config.shirtSize) && sizes.includes(config.pantsSize)
        : editions.includes(config.edition) && sizes.includes(config.size));
      if (!Object.hasOwn(PRODUCT_PRICE_EUR, productId)) throw new Error('Producto no válido en carrito.');
      if (!validConfig) throw new Error('Configuración de producto no válida.');
      const price = superpibesPriceFor(productId, config);
      if (!price) throw new Error(`Producto no configurado en Stripe: ${productId}`);
      if (!Number.isFinite(PRODUCT_PRICE_EUR[productId]) || PRODUCT_PRICE_EUR[productId] <= 0) throw new Error(`Importe no configurado para ${productId}`);
      const lines = [{ price, quantity, productId }];
      const personalizationName = String(item?.configuration?.personalizationName || '').trim();
      if (personalizationName) {
        if (!['picklemania-superpibes-shirt', 'picklemania-superpibes-kit'].includes(productId)) throw new Error('Este producto no admite personalización.');
        if (personalizationName.length > 24) throw new Error('El nombre de personalización es demasiado largo.');
        if (!process.env.STRIPE_PRICE_SUPERPIBES_PERSONALIZATION) throw new Error('Personalización pendiente de configuración en Stripe.');
        lines.push({ price: process.env.STRIPE_PRICE_SUPERPIBES_PERSONALIZATION, quantity, productId: 'superpibes-personalization' });
      }
      if (productId.startsWith('picklemania-superpibes-')) {
        const safeConfig = isKit
          ? { shirtEdition: config.shirtEdition, shirtSize: config.shirtSize, pantsEdition: config.pantsEdition, pantsSize: config.pantsSize, personalizationName }
          : { edition: config.edition, size: config.size, personalizationName };
        configurations.push(`${productId}: ${JSON.stringify(safeConfig)}`);
      }
      return lines;
    });

    const subtotal = line_items.reduce((sum, line) => sum + (line.productId === 'superpibes-personalization' ? 5 : (PRODUCT_PRICE_EUR[line.productId] || 0)) * line.quantity, 0);
    const zoneName = detectShippingZone(country, customer.address.postal_code);
    if (!zoneName) {
      return res.status(400).json({ error: 'Actualmente no enviamos a este país.' });
    }

    const hasSuperpibes = items.some((item) => String(item?.productId || '').startsWith('picklemania-superpibes-'));
    const shippingRateId = hasSuperpibes ? null : getShippingRateId(zoneName, subtotal);
    if (hasSuperpibes) line_items.push({
      price_data: { currency: 'eur', product_data: { name: 'Envío' }, unit_amount: 1200 },
      quantity: 1,
      productId: 'shipping'
    });

    const checkoutSessionParams = {
      mode: 'payment',
      line_items: line_items.map(({ price, price_data, quantity }) => (price ? { price, quantity } : { price_data, quantity })),
      allow_promotion_codes: true,
      ...(shippingRateId ? { shipping_options: [{ shipping_rate: shippingRateId }] } : {}),
      customer_email: customer.email,
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
      customer_update: { shipping: 'auto', name: 'auto', address: 'auto' },
      automatic_tax: { enabled: true },
      phone_number_collection: { enabled: true },
      metadata: {
        shipping_zone: zoneName,
        shipping_rate_id: shippingRateId || 'superpibes_fixed_1200',
        subtotal_eur: String(subtotal.toFixed(2)),
        product_configurations: configurations.join(' | ').slice(0, 500)
      },
      success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/cancel.html`
    };

    console.log('[Stripe Checkout] Creating session with allow_promotion_codes=%s', checkoutSessionParams.allow_promotion_codes);

    const session = await stripe.checkout.sessions.create(checkoutSessionParams);

    console.log('[Stripe Checkout] Created session %s allow_promotion_codes=%s', session.id, session.allow_promotion_codes);

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'No se pudo crear la sesión' });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(port, () => console.log(`Backend Stripe en puerto ${port}`));
