<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://picklemaniaweb.es');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$config = require __DIR__ . '/config.php';
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Dependencias de Stripe no instaladas.']);
    exit;
}

require_once $autoloadPath;

\Stripe\Stripe::setApiKey((string)($config['stripe_secret_key'] ?? ''));

$rawBody = file_get_contents('php://input');
$payload = json_decode((string)$rawBody, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

$catalog = [
    'picklemania-black-paddle' => ['price_id' => 'price_1TZAwNQl1Fppe3qeUCGWWHPc', 'unit_amount' => 9000],
    'picklemania-white-paddle' => ['price_id' => 'price_1TZAwsQl1Fppe3qeyJnl6vyx', 'unit_amount' => 9000],
];

$items = $payload['items'] ?? [];
if (!is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'No hay productos en el carrito.']);
    exit;
}

$lineItems = [];
$subtotalCents = 0;

foreach ($items as $item) {
    if (!is_array($item)) {
        continue;
    }

    $productId = (string)($item['productId'] ?? '');
    $quantity = max(1, (int)($item['quantity'] ?? 1));

    if (!isset($catalog[$productId])) {
        http_response_code(400);
        echo json_encode(['error' => 'Producto no válido en carrito.']);
        exit;
    }

    $product = $catalog[$productId];
    $subtotalCents += ((int)$product['unit_amount']) * $quantity;

    $lineItems[] = [
        'price' => $product['price_id'],
        'quantity' => $quantity,
    ];
}

$customer = $payload['customer'] ?? null;
$shippingRateByZone = [
    'ES' => 495,
    'CANARIAS' => 1995,
    'EU_1' => 1495,
    'EU_2' => 1995,
];

function zoneForShipping(?array $customer, int $subtotalCents): ?string
{
    $supported = ['ES', 'FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT', 'PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];
    $eu1 = ['FR', 'IT', 'DE', 'PT', 'BE', 'NL', 'AT'];
    $eu2 = ['PL', 'CZ', 'BG', 'GR', 'RO', 'SE', 'DK', 'FI'];

    $country = strtoupper((string)($customer['address']['country'] ?? ''));
    $postal = preg_replace('/\s+/', '', (string)($customer['address']['postal_code'] ?? ''));

    if ($country === '' || !in_array($country, $supported, true)) {
        return null;
    }

    if ($country === 'ES') {
        $prefix2 = substr($postal, 0, 2);
        if ($prefix2 === '35' || $prefix2 === '38') {
            return 'CANARIAS';
        }
        return $subtotalCents >= 6000 ? 'FREE' : 'ES';
    }

    if (in_array($country, $eu1, true)) {
        return $subtotalCents >= 13000 ? 'FREE' : 'EU_1';
    }

    if (in_array($country, $eu2, true)) {
        return $subtotalCents >= 18000 ? 'FREE' : 'EU_2';
    }

    return null;
}

try {
    $customerParams = [];
    if (is_array($customer)) {
        $name = trim((string)($customer['name'] ?? ''));
        $email = trim((string)($customer['email'] ?? ''));
        $phone = trim((string)($customer['phone'] ?? ''));
        $address = $customer['address'] ?? [];

        if ($name !== '') $customerParams['name'] = $name;
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) $customerParams['email'] = $email;
        if ($phone !== '') $customerParams['phone'] = $phone;

        if (is_array($address)) {
            $country = strtoupper(trim((string)($address['country'] ?? '')));
            $line1 = trim((string)($address['line1'] ?? ''));
            $postalCode = trim((string)($address['postal_code'] ?? ''));
            $city = trim((string)($address['city'] ?? ''));
            $state = trim((string)($address['state'] ?? ''));

            if ($country !== '' && $line1 !== '' && $postalCode !== '' && $city !== '') {
                $customerParams['address'] = [
                    'country' => $country,
                    'line1' => $line1,
                    'postal_code' => $postalCode,
                    'city' => $city,
                    'state' => $state,
                ];
            }
        }
    }

    $shippingZone = zoneForShipping(is_array($customer) ? $customer : null, $subtotalCents);
    if ($shippingZone === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Dirección de envío no válida o no soportada.']);
        exit;
    }

    if ($shippingZone !== 'FREE') {
        $shippingAmount = $shippingRateByZone[$shippingZone] ?? 0;
        if ($shippingAmount > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => ['name' => 'Envío'],
                    'unit_amount' => $shippingAmount,
                ],
                'quantity' => 1,
            ];
        }
    }

    $checkoutSessionParams = [
        'mode' => 'payment',
        'line_items' => $lineItems,
        'allow_promotion_codes' => true,
        'success_url' => (string)$config['success_url'],
        'cancel_url' => (string)$config['cancel_url'],
        'customer_email' => $customerParams['email'] ?? null,
        'metadata' => [
            'customer_name' => $customerParams['name'] ?? '',
            'customer_phone' => $customerParams['phone'] ?? '',
            'shipping_country' => $customerParams['address']['country'] ?? '',
            'shipping_postal' => $customerParams['address']['postal_code'] ?? '',
            'shipping_city' => $customerParams['address']['city'] ?? '',
            'shipping_line1' => $customerParams['address']['line1'] ?? '',
            'shipping_state' => $customerParams['address']['state'] ?? '',
        ],
    ];

    error_log('[Stripe Checkout] Creating session with allow_promotion_codes=' . ($checkoutSessionParams['allow_promotion_codes'] ? 'true' : 'false'));

    $session = \Stripe\Checkout\Session::create($checkoutSessionParams);

    error_log('[Stripe Checkout] Created session ' . $session->id . ' allow_promotion_codes=' . (($session->allow_promotion_codes ?? false) ? 'true' : 'false'));

    echo json_encode(['url' => $session->url]);
} catch (\Throwable $e) {
    error_log('[Stripe Checkout] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo iniciar Stripe Checkout. Inténtalo de nuevo en unos minutos.']);
}
