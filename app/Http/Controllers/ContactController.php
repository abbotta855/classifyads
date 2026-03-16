<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Services\SendGridService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Submit contact form
     */
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:5000',
            'captcha_answer' => 'required|integer',
            'captcha_question' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify CAPTCHA
        $expectedAnswer = (int) explode('=', $request->captcha_question)[1];
        if ((int) $request->captcha_answer !== $expectedAnswer) {
            return response()->json([
                'error' => 'Invalid CAPTCHA answer. Please try again.',
            ], 422);
        }

        // Create contact message
        $contactMessage = ContactMessage::create([
            'name' => $request->name,
            'email' => $request->email,
            'message' => $request->message,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'pending',
        ]);

        // Send email notification to admin
        try {
            $adminEmail = env('ADMIN_EMAIL', env('MAIL_FROM_ADDRESS', 'admin@example.com'));
            $sendGridService = new SendGridService();
            
            $emailSubject = 'New Contact Form Submission - ' . $request->name;
            $emailContent = "
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> {$request->name}</p>
                <p><strong>Email:</strong> {$request->email}</p>
                <p><strong>Message:</strong></p>
                <p>" . nl2br(e($request->message)) . "</p>
                <p><strong>Submitted:</strong> " . now()->format('Y-m-d H:i:s') . "</p>
            ";

            $sendGridService->sendEmail($adminEmail, $emailSubject, $emailContent);
        } catch (\Exception $e) {
            Log::error('Failed to send contact form email: ' . $e->getMessage());
            // Don't fail the request if email fails
        }

        return response()->json([
            'message' => 'Thank you for contacting us! We will get back to you soon.',
            'contact_id' => $contactMessage->id,
        ], 201);
    }

    /**
     * Generate CAPTCHA question
     */
    public function generateCaptcha()
    {
        $num1 = rand(1, 10);
        $num2 = rand(1, 10);
        $answer = $num1 + $num2;
        $question = "{$num1} + {$num2} = ?";

        return response()->json([
            'question' => $question,
            'answer' => $answer, // For verification (normally you'd hash this)
        ]);
    }
}
