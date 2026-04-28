(function () {
  const PRODUCTS = [
    {
      id: 'picklemania-black-paddle',
      name: 'Picklemania Black Paddle',
      slug: 'black-paddle',
      category: 'paddle',
      type: 'paddle',
      price: 9900,
      displayPrice: '99€',
      description: 'Pala equilibrada para control, estabilidad y respuesta consistente en pista.',
      longDescription: 'Diseñada para jugadores que buscan una sensación sólida desde el primer golpe, con tacto estable, salida controlada y un balance medio ideal para entrenos y competición.',
      image: 'img/pala-1.png',
      gallery: ['img/pala-1.png'],
      stripePriceId: 'price_1TRCmSQl1Fppe3qe4KmY2R2i',
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
      price: 9900,
      displayPrice: '99€',
      description: 'Pala equilibrada diseñada para control, estabilidad y precisión, con estética blanca minimalista y rendimiento consistente en cada punto.',
      longDescription: 'Una pala de respuesta predecible y estable para dominar intercambios largos, transiciones y bolas de precisión, con acabado blanco premium para una presencia elegante en pista.',
      image: 'img/pala-white.png',
      fallbackImage: 'img/pala-1.png',
      gallery: ['img/pala-white.png'],
      stripePriceId: 'price_WHITE_PADDLE',
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
