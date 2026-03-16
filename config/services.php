<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode' => env('PAYPAL_MODE', 'sandbox'), // 'sandbox' or 'live'
        'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
        'demo_mode' => env('WALLET_DEMO_MODE', false), // Enable demo mode (bypasses PayPal)
    ],

    'withdrawal' => [
        'min_amount' => env('WITHDRAWAL_MIN_AMOUNT', 10.00), // Minimum withdrawal amount
        'max_amount' => env('WITHDRAWAL_MAX_AMOUNT', 10000.00), // Maximum withdrawal per request
        'daily_limit' => env('WITHDRAWAL_DAILY_LIMIT', 50000.00), // Maximum withdrawals per day
        'daily_count_limit' => env('WITHDRAWAL_DAILY_COUNT_LIMIT', 3), // Maximum number of withdrawals per day
    ],

];
