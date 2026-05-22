<?php

declare(strict_types=1);

return [
    'stripe_secret_key' => getenv('STRIPE_SECRET_KEY') ?: 'sk_live_xxxxxxxxx',
    'success_url' => 'https://picklemaniaweb.es/gracias',
    'cancel_url' => 'https://picklemaniaweb.es/carrito',
];
