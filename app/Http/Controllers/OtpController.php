<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\OtpMail;
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

        // Generate 6-digit OTP
        $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Set expiration to 10 minutes from now
        $user->otp_code = $otpCode;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send OTP via email
        try {
            Mail::to($user->email)->send(new OtpMail($otpCode, $user->name));
            \Log::info('OTP email sent to: ' . $user->email . ' | OTP Code: ' . $otpCode);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send OTP email to ' . $user->email . ': ' . $e->getMessage());
            \Log::error('OTP Code generated but not sent: ' . $otpCode);
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
