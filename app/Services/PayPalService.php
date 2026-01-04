<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    private ?string $clientId;
    private ?string $clientSecret;
    private string $mode; // 'sandbox' or 'live'
    private string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.client_secret');
        $this->mode = config('services.paypal.mode', 'sandbox');
        $this->baseUrl = $this->mode === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';
    }

    /**
     * Get PayPal access token
     */
    public function getAccessToken(): ?string
    {
        if (!$this->clientId || !$this->clientSecret) {
            Log::error('PayPal credentials not configured');
            return null;
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error('PayPal access token error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal access token exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create a PayPal order
     */
    public function createOrder(float $amount, string $currency = 'USD', array $items = [], ?string $returnUrl = null, ?string $cancelUrl = null): ?array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return null;
        }

        try {
            $purchaseUnits = [
                [
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                ],
            ];

            // Add items if provided
            if (!empty($items)) {
                $purchaseUnits[0]['items'] = $items;
                $purchaseUnits[0]['amount']['breakdown'] = [
                    'item_total' => [
                        'currency_code' => $currency,
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                ];
            }

            // Use custom URLs if provided, otherwise default to eBook payment URLs
            $returnUrl = $returnUrl ?? config('app.url') . '/api/ebooks/payment/success';
            $cancelUrl = $cancelUrl ?? config('app.url') . '/api/ebooks/payment/cancel';

            $response = Http::withToken($accessToken)
                ->post("{$this->baseUrl}/v2/checkout/orders", [
                    'intent' => 'CAPTURE',
                    'purchase_units' => $purchaseUnits,
                    'application_context' => [
                        'brand_name' => config('app.name'),
                        'landing_page' => 'NO_PREFERENCE',
                        'user_action' => 'PAY_NOW',
                        'return_url' => $returnUrl,
                        'cancel_url' => $cancelUrl,
                    ],
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('PayPal create order error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal create order exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Capture a PayPal order
     */
    public function captureOrder(string $orderId): ?array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return null;
        }

        try {
            $response = Http::withToken($accessToken)
                ->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('PayPal capture order error', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal capture order exception', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get order details
     */
    public function getOrder(string $orderId): ?array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return null;
        }

        try {
            $response = Http::withToken($accessToken)
                ->get("{$this->baseUrl}/v2/checkout/orders/{$orderId}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal get order exception', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Refund a PayPal payment
     * @param string $captureId The PayPal capture ID from the original payment
     * @param float|null $amount Optional partial refund amount. If null, full refund
     * @param string $currency Currency code (default: USD)
     * @return array|null Refund details or null on failure
     */
    public function refundPayment(string $captureId, ?float $amount = null, string $currency = 'USD'): ?array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('PayPal refund: No access token');
            return null;
        }

        try {
            $refundData = [];
            
            // If amount is specified, do partial refund
            if ($amount !== null) {
                $refundData['amount'] = [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency_code' => $currency,
                ];
            }
            // If amount is null, full refund is performed

            $response = Http::withToken($accessToken)
                ->post("{$this->baseUrl}/v2/payments/captures/{$captureId}/refund", $refundData);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('PayPal refund error', [
                'capture_id' => $captureId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal refund exception', [
                'capture_id' => $captureId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Create a PayPal payout (send money to PayPal account)
     * @param string $paypalEmail PayPal email address of the recipient
     * @param float $amount Amount to send
     * @param string $currency Currency code (default: USD)
     * @param string $note Optional note for the payout
     * @return array|null Payout details or null on failure
     */
    public function createPayout(string $paypalEmail, float $amount, string $currency = 'USD', string $note = ''): ?array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('PayPal payout: No access token');
            return null;
        }

        try {
            // Generate a unique sender batch ID
            $senderBatchId = 'WITHDRAWAL-' . time() . '-' . uniqid();

            $payoutData = [
                'sender_batch_header' => [
                    'sender_batch_id' => $senderBatchId,
                    'email_subject' => 'You have received a withdrawal payment',
                    'email_message' => $note ?: "You have received a withdrawal payment of $" . number_format($amount, 2),
                ],
                'items' => [
                    [
                        'recipient_type' => 'EMAIL',
                        'amount' => [
                            'value' => number_format($amount, 2, '.', ''),
                            'currency' => $currency,
                        ],
                        'receiver' => $paypalEmail,
                        'note' => $note ?: "Withdrawal payment",
                        'sender_item_id' => 'WITHDRAWAL-' . time(),
                    ],
                ],
            ];

            $response = Http::withToken($accessToken)
                ->post("{$this->baseUrl}/v1/payments/payouts", $payoutData);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('PayPal payout created', [
                    'batch_id' => $result['batch_header']['payout_batch_id'] ?? null,
                    'sender_batch_id' => $senderBatchId,
                    'amount' => $amount,
                    'email' => $paypalEmail,
                ]);
                return $result;
            }

            Log::error('PayPal payout error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'email' => $paypalEmail,
                'amount' => $amount,
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('PayPal payout exception', [
                'email' => $paypalEmail,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}

