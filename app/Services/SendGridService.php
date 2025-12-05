<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendGridService
{
    private $apiKey;
    private $fromEmail;
    private $fromName;

    public function __construct()
    {
        $this->apiKey = env('SENDGRID_API_KEY');
        $this->fromEmail = env('MAIL_FROM_ADDRESS', 'noreply@em3028.ebyapar.com');
        $this->fromName = env('MAIL_FROM_NAME', env('APP_NAME', 'MyApp'));
    }

    public function sendEmail($to, $subject, $htmlContent, $textContent = null)
    {
        try {
            // Disable SSL verification temporarily to bypass certificate issues
            // In production, you should fix SSL certificates properly
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.sendgrid.com/v3/mail/send', [
                'personalizations' => [
                    [
                        'to' => [
                            ['email' => $to]
                        ],
                        'subject' => $subject
                    ]
                ],
                'from' => [
                    'email' => $this->fromEmail,
                    'name' => $this->fromName
                ],
                'content' => [
                    [
                        'type' => 'text/html',
                        'value' => $htmlContent
                    ]
                ]
            ]);

            if ($response->successful()) {
                Log::info('SendGrid email sent successfully to: ' . $to);
                return true;
            } else {
                Log::error('SendGrid API error - Status: ' . $response->status());
                Log::error('SendGrid API error - Body: ' . $response->body());
                Log::error('SendGrid API error - Headers: ' . json_encode($response->headers()));
                return false;
            }
        } catch (\Exception $e) {
            Log::error('SendGrid service error: ' . $e->getMessage());
            Log::error('SendGrid service error trace: ' . $e->getTraceAsString());
            return false;
        }
    }
}

