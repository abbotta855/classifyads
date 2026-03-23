<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\OtpMail;
use App\Services\SendGridService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    /**
     * Generate and send OTP to user
     */
    public function generate(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        
        // Skip OTP for super_admin users
        if ($user->role === 'super_admin') {
            \Log::info('OTP generation skipped for super_admin: ' . $user->email);
            return response()->json([
                'message' => 'OTP verification is not required for super admin accounts.',
                'expires_at' => null,
            ], 200);
        }
        
        // Log where the request is coming from
        $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
        $callerInfo = isset($caller[1]) ? ($caller[1]['class'] ?? 'Unknown') . '::' . ($caller[1]['function'] ?? 'Unknown') : 'Direct API call';
        \Log::info('OTP generate called for: ' . $user->email . ' | Caller: ' . $callerInfo);

        // Prevent generating new OTP if one was generated recently (within last 5 seconds)
        // This prevents race conditions where multiple requests generate OTP simultaneously
        if ($user->otp_code && $user->otp_expires_at && Carbon::now()->lt($user->otp_expires_at)) {
            // Calculate when OTP was generated (expires_at - 10 minutes)
            $otpGeneratedAt = $user->otp_expires_at->copy()->subMinutes(10);
            $secondsSinceGeneration = Carbon::now()->diffInSeconds($otpGeneratedAt);
            
            if ($secondsSinceGeneration < 5) {
                \Log::info('OTP generation skipped - OTP was generated ' . $secondsSinceGeneration . ' seconds ago for: ' . $user->email);
                return response()->json([
                    'message' => 'OTP has already been sent. Please check your email or wait a few seconds before requesting a new one.',
                    'expires_at' => $user->otp_expires_at->toIso8601String(),
                ], 200);
            }
        }

        // Generate 6-digit OTP
        $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Set expiration to 10 minutes from now
        $user->otp_code = $otpCode;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();
        
        \Log::info('OTP generated and saved to database for: ' . $user->email);

        // Send OTP via email - try SendGrid first if API key exists, otherwise use SMTP directly
        $mailDelivered = false;
        try {
            $sendGridApiKey = config('services.sendgrid.key');

            // Only try SendGrid if API key is configured
            if (! empty($sendGridApiKey)) {
                $sendGridService = new SendGridService();
                
                // Render email template
                $htmlContent = view('emails.otp', [
                    'otpCode' => $otpCode,
                    'userName' => $user->name
                ])->render();
                
                $textContent = "Hello {$user->name},\n\nYour OTP verification code is: {$otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.";
                
                $sent = $sendGridService->sendEmail(
                    $user->email,
                    'Your OTP Verification Code',
                    $htmlContent,
                    $textContent
                );
                
                if ($sent) {
                    \Log::info('OTP email sent via SendGrid API to: ' . $user->email);
                    $mailDelivered = true;
                    return response()->json([
                        'message' => 'OTP has been sent to your email address.',
                        'expires_at' => $user->otp_expires_at->toIso8601String(),
                    ]);
                }
                \Log::warning('SendGrid failed, falling back to SMTP for: ' . $user->email);
            } else {
                \Log::info('SendGrid API key not configured, using SMTP directly for: ' . $user->email);
            }

            // Use SMTP directly (sends synchronously, not queued)
            Mail::to($user->email)->send(new OtpMail($otpCode, $user->name));
            \Log::info('OTP email sent via SMTP to: ' . $user->email);
            $mailDelivered = true;

        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email to ' . $user->email . ': ' . $e->getMessage());
            \Log::error('Full error trace: ' . $e->getTraceAsString());
            \Log::error('Mail config check - default: ' . config('mail.default'));
            \Log::error('Mail config check - host: ' . config('mail.mailers.smtp.host'));
            \Log::error('Mail config check - port: ' . config('mail.mailers.smtp.port'));
            \Log::error('Mail config check - username: ' . config('mail.mailers.smtp.username'));
        }

        if (! $mailDelivered) {
            return response()->json([
                'message' => 'We could not send the verification email. Please try again in a few minutes or contact support.',
                'expires_at' => $user->otp_expires_at->toIso8601String(),
                'email_delivery_failed' => true,
            ], 503);
        }

        return response()->json([
            'message' => 'OTP has been sent to your email address.',
            'expires_at' => $user->otp_expires_at->toIso8601String(),
        ]);
    }

    /**
     * Verify OTP code
     */
    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp_code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if OTP exists
        if (!$user->otp_code) {
            throw ValidationException::withMessages([
                'otp_code' => ['No OTP code found. Please request a new one.'],
            ]);
        }

        // Check if OTP is expired
        if ($user->otp_expires_at && Carbon::now()->isAfter($user->otp_expires_at)) {
            throw ValidationException::withMessages([
                'otp_code' => ['OTP code has expired. Please request a new one.'],
            ]);
        }

        // Check if OTP matches
        if ($user->otp_code !== $request->otp_code) {
            throw ValidationException::withMessages([
                'otp_code' => ['Invalid OTP code. Please try again.'],
            ]);
        }

        // Check if user is already verified (for inactivity verification)
        $wasAlreadyVerified = $user->is_verified;

        // Verify user (if not already verified)
        if (!$user->is_verified) {
            $user->is_verified = true;
            $user->email_verified_at = Carbon::now();
        }

        // If user was already verified, this is likely for inactivity verification
        // Update last_login_at to allow login to proceed
        if ($wasAlreadyVerified) {
            $user->last_login_at = Carbon::now();
        }

        // Clear OTP
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        $message = $wasAlreadyVerified 
            ? 'Identity verified successfully. You can now complete your login.'
            : 'Email verified successfully.';

        return response()->json([
            'message' => $message,
            'user' => $user->only(['id', 'name', 'email', 'is_verified']),
            'was_already_verified' => $wasAlreadyVerified,
        ]);
    }

    /**
     * Resend OTP code
     */
    public function resend(Request $request)
    {
        return $this->generate($request);
    }
}
