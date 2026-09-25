(function () {
  // Los importes de Superpibes se completan aquí cuando se creen los precios en Stripe.
  // Se mantienen como null para no publicar ni cobrar precios provisionales.
  const SUPERPIBES_PRICES = {
    shirt: null,
    pants: null,
    kit: null,
    personalization: 500
  };

  const PRODUCTS = [
    {
      id: 'picklemania-black-paddle',
      name: 'Picklemania Black Paddle',
      slug: 'black-paddle',
      category: 'paddle',
      type: 'paddle',
      price: 9000,
      displayPrice: '90€',
      description: 'Pala equilibrada para control, estabilidad y respuesta consistente en pista.',
      longDescription: 'Diseñada para jugadores que buscan una sensación sólida desde el primer golpe, con tacto estable, salida controlada y un balance medio ideal para entrenos y competición.',
      image: 'img/pala-1.png',
      gallery: ['img/pala-1.png'],
      stripePriceId: 'price_1TZAwNQl1Fppe3qeUCGWWHPc',
      specs: [
        'Fibra de vidrio',
        'Núcleo honeycomb',
        'Grosor 16 mm',
        'Peso 310–330 g',
        'Balance medio',
        'Acabado mate rugoso'
      ],
      features: ['En stock', 'Envío 24/48h', 'Pago seguro con Stripe'],
      badges: ['En stock', 'Envío 24/48h']
    },
    {
      id: 'picklemania-white-paddle',
      name: 'Picklemania White Paddle',
      slug: 'white-paddle',
      category: 'paddle',
      type: 'paddle',
      price: 9000,
      displayPrice: '90€',
      description: 'Pala equilibrada diseñada para control, estabilidad y precisión, con estética blanca minimalista y rendimiento consistente en cada punto.',
      longDescription: 'Una pala de respuesta predecible y estable para dominar intercambios largos, transiciones y bolas de precisión, con acabado blanco premium para una presencia elegante en pista.',
      image: 'img/pala-white.png',
      fallbackImage: 'img/pala-1.png',
      gallery: ['img/pala-white.png'],
      stripePriceId: 'price_1TZAwsQl1Fppe3qeyJnl6vyx',
      specs: [
        'Fibra de vidrio',
        'Núcleo honeycomb',
        'Grosor 16 mm',
        'Peso 310–330 g',
        'Balance medio',
        'Acabado mate rugoso'
      ],
      features: ['Nuevo', 'En stock', 'Envío 24/48h', 'Pago seguro con Stripe'],
      badges: ['Nuevo', 'En stock', 'Envío 24/48h']
    },
    {
      id: 'picklemania-superpibes-shirt', name: 'Picklemania x Superpibes — Camiseta', slug: 'superpibes-camiseta', category: 'apparel', type: 'shirt',
      price: SUPERPIBES_PRICES.shirt, displayPrice: 'Precio pendiente', description: 'Camiseta oficial Superpibes para competición, entrenos y comunidad.', image: '',
      stripePriceEnv: 'STRIPE_PRICE_SUPERPIBES_SHIRT', allowsPersonalization: true
    },
    {
      id: 'picklemania-superpibes-pants', name: 'Picklemania x Superpibes — Pantalón', slug: 'superpibes-pantalon', category: 'apparel', type: 'pants',
      price: SUPERPIBES_PRICES.pants, displayPrice: 'Precio pendiente', description: 'Pantalón oficial Superpibes con dos ediciones para la pista.', image: '',
      stripePriceEnv: 'STRIPE_PRICE_SUPERPIBES_PANTS', allowsPersonalization: false
    },
    {
      id: 'picklemania-superpibes-kit', name: 'Picklemania x Superpibes — Equipación Completa', slug: 'superpibes-equipacion', category: 'apparel', type: 'kit',
      price: SUPERPIBES_PRICES.kit, displayPrice: 'Precio pendiente', description: 'Camiseta y pantalón oficiales Superpibes configurados de forma independiente.', image: '',
      stripePriceEnv: 'STRIPE_PRICE_SUPERPIBES_KIT', allowsPersonalization: true
    }
  ];

  const byId = PRODUCTS.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  window.PICKLEMANIA_PRODUCTS = PRODUCTS;
  window.PicklemaniaProducts = {
    all: PRODUCTS,
    getById: (id) => byId[id] || null
  };
})();
