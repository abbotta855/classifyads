<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\SupportOfflineMessage;
use App\Http\Controllers\OtpController;
use App\Mail\PasswordResetMail;
use App\Services\SendGridService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
  public function register(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'email' => [
        'required',
        'string',
        'email',
        'max:255',
        'unique:users',
        'regex:/\.com$/',
      ],
      'password' => 'required|string|min:8|confirmed',
    ], [
      'email.regex' => 'Confirm your email is correct',
    ]);

    // Regular registration always creates 'user' role
    // Super_admin users are created via seeders or admin panel, not through registration
    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'password' => Hash::make($request->password),
      'role' => 'user', // Default role for new registrations
      'is_verified' => false, // User needs to verify via OTP
    ]);

    // Convert any pending offline messages from this email to LiveChat
    // Only convert messages that are NOT already linked to a user (to avoid duplicates)
    $offlineMessages = SupportOfflineMessage::where('guest_email', $user->email)
      ->whereNull('user_id')
      ->whereNull('replied_at')
      ->get();

    $convertedMessages = 0;
    if ($offlineMessages->isNotEmpty()) {
      // Create or get existing LiveChat for this user (prevents duplicate LiveChats)
      $liveChat = LiveChat::firstOrCreate(
        ['user_id' => $user->id],
        [
          'last_message_at' => now(),
          'unread_admin_count' => $offlineMessages->count(),
        ]
      );

      // Convert offline messages to LiveChatMessage entries
      // Check for duplicates to prevent creating the same message twice
      foreach ($offlineMessages as $offlineMsg) {
        // Check if this message already exists in LiveChat (prevent duplicates)
        $existingMessage = LiveChatMessage::where('live_chat_id', $liveChat->id)
          ->where('message', $offlineMsg->message)
          ->where('sender_type', 'user')
          ->whereBetween('sent_at', [
            $offlineMsg->created_at->copy()->subMinutes(1),
            $offlineMsg->created_at->copy()->addMinutes(1)
          ])
          ->first();

        if (!$existingMessage) {
          // Only create if message doesn't already exist
          LiveChatMessage::create([
            'live_chat_id' => $liveChat->id,
            'sender_type' => 'user',
            'message' => $offlineMsg->message,
            'is_read' => false, // Admin hasn't read these yet
            'sent_at' => $offlineMsg->created_at ?? now(),
          ]);
          $convertedMessages++;
        }

        // Mark offline message as converted (set user_id and replied_at)
        // This prevents it from being converted again
        $offlineMsg->update([
          'user_id' => $user->id,
          'replied_at' => now(), // Mark as handled
        ]);
      }

      // Update LiveChat last_message_at and unread count
      $liveChat->update([
        'last_message_at' => $offlineMessages->sortByDesc('created_at')->first()->created_at ?? now(),
        'unread_admin_count' => $liveChat->messages()->where('sender_type', 'user')->where('is_read', false)->count(),
      ]);
    }

    // Generate and send OTP for regular users
    $otpController = new OtpController();
    $otpRequest = new Request(['email' => $user->email]);
    $otpResponse = $otpController->generate($otpRequest);

    $responseData = [
      'user' => $user->only(['id', 'name', 'email', 'is_verified']),
      'message' => 'Registration successful. Please check your email for OTP verification code.',
      'requires_verification' => true,
    ];

    // Include conversion info if messages were converted
    if ($convertedMessages > 0) {
      $responseData['converted_messages'] = $convertedMessages;
      $responseData['message'] .= " Your previous support messages have been converted to live chat.";
    }

    return response()->json($responseData, 201);
  }

  public function login(Request $request)
  {
    $request->validate([
      'email' => [
        'required',
        'email',
        'regex:/\.com$/',
      ],
      'password' => 'required',
    ], [
      'email.regex' => 'Confirm your email is correct',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
      throw ValidationException::withMessages([
        'email' => ['The provided credentials are incorrect.'],
      ]);
    }

    // OTP is NOT required for login - users can login directly
    // Only registration requires OTP (and super_admin doesn't need OTP even for registration)

    // Convert any pending offline messages from this email to LiveChat (if not already converted)
    // Only convert messages that are NOT already linked to a user (to avoid duplicates)
    $offlineMessages = SupportOfflineMessage::where('guest_email', $user->email)
      ->whereNull('user_id')
      ->whereNull('replied_at')
      ->get();

    $convertedMessages = 0;
    if ($offlineMessages->isNotEmpty()) {
      // Create or get existing LiveChat for this user (prevents duplicate LiveChats)
      $liveChat = LiveChat::firstOrCreate(
        ['user_id' => $user->id],
        [
          'last_message_at' => now(),
          'unread_admin_count' => 0,
        ]
      );

      // Convert offline messages to LiveChatMessage entries
      // Check for duplicates to prevent creating the same message twice
      foreach ($offlineMessages as $offlineMsg) {
        // Check if this message already exists in LiveChat (prevent duplicates)
        $existingMessage = LiveChatMessage::where('live_chat_id', $liveChat->id)
          ->where('message', $offlineMsg->message)
          ->where('sender_type', 'user')
          ->whereBetween('sent_at', [
            $offlineMsg->created_at->copy()->subMinutes(1),
            $offlineMsg->created_at->copy()->addMinutes(1)
          ])
          ->first();

        if (!$existingMessage) {
          // Only create if message doesn't already exist
          LiveChatMessage::create([
            'live_chat_id' => $liveChat->id,
            'sender_type' => 'user',
            'message' => $offlineMsg->message,
            'is_read' => false, // Admin hasn't read these yet
            'sent_at' => $offlineMsg->created_at ?? now(),
          ]);
          $convertedMessages++;
        }

        // Mark offline message as converted (set user_id and replied_at)
        // This prevents it from being converted again
        $offlineMsg->update([
          'user_id' => $user->id,
          'replied_at' => now(), // Mark as handled
        ]);
      }

      // Update LiveChat last_message_at and unread count
      $liveChat->update([
        'last_message_at' => $offlineMessages->sortByDesc('created_at')->first()->created_at ?? now(),
        'unread_admin_count' => $liveChat->messages()->where('sender_type', 'user')->where('is_read', false)->count(),
      ]);
    }

    // Update last login timestamp
    $user->last_login_at = Carbon::now();
    $user->save();

    $token = $user->createToken('auth_token')->plainTextToken;

    // Determine redirect path based on role
    $redirectPath = '/dashboard';
    if ($user->role === 'super_admin' || $user->role === 'admin') {
      $redirectPath = $user->role === 'super_admin' ? '/super_admin' : '/admin';
    }

    $responseData = [
      'user' => $user,
      'token' => $token,
      'message' => 'Login successful',
      'redirect_path' => $redirectPath, // Include redirect path for frontend
    ];

    // Include conversion info if messages were converted
    if ($convertedMessages > 0) {
      $responseData['converted_messages'] = $convertedMessages;
      $responseData['message'] .= " Your previous support messages have been converted to live chat.";
    }

    return response()->json($responseData);
  }

  public function logout(Request $request)
  {
    $user = $request->user();
    
    // Check if user is admin/super_admin before logout
    $isAdmin = $user && (
      (method_exists($user, 'isAdmin') && $user->isAdmin()) ||
      (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) ||
      (property_exists($user, 'role') && in_array($user->role, ['admin', 'super_admin']))
    );

    // Delete the authentication token
    $user->currentAccessToken()->delete();

    // If admin logged out, clear admin presence cache to mark support as offline
    // This ensures that when admin logs out, support status immediately reflects as offline
    if ($isAdmin) {
      Cache::forget('support:availability:last_seen');
      Cache::forget('support:availability:manual'); // Clear manual override too on logout
    }

    return response()->json([
      'message' => 'Logged out successfully',
    ]);
  }

  public function user(Request $request)
  {
    return response()->json($request->user());
  }

  /**
   * Change password for any user (except super_admin) - Super Admin only
   */
  public function changePassword(Request $request)
  {
    // Only super_admin can change passwords through this endpoint
    if ($request->user()->role !== 'super_admin') {
      return response()->json([
        'message' => 'Unauthorized. Only super admin can change user passwords.',
      ], 403);
    }

    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'new_password' => 'required|string|min:8|confirmed',
    ], [
      'user_id.required' => 'User ID is required.',
      'user_id.exists' => 'User not found.',
      'new_password.confirmed' => 'The new password confirmation does not match.',
      'new_password.min' => 'The new password must be at least 8 characters.',
    ]);

    $targetUser = User::findOrFail($validated['user_id']);

    // Allow changing passwords for all roles (admin, user, super_admin)
    // Update password
    $targetUser->password = Hash::make($validated['new_password']);
    $targetUser->save();

    return response()->json([
      'message' => 'Password changed successfully.',
      'user' => [
        'id' => $targetUser->id,
        'name' => $targetUser->name,
        'email' => $targetUser->email,
        'role' => $targetUser->role,
      ],
    ]);
  }

  /**
   * Send password reset code to user's email (using same pattern as OTP)
   */
  public function forgotPassword(Request $request)
  {
    $request->validate([
      'email' => [
        'required',
        'email',
        'regex:/\.com$/',
      ],
    ], [
      'email.regex' => 'Confirm your email is correct',
    ]);

    $user = User::where('email', $request->email)->first();

    // Always return success message to prevent email enumeration
    // But only send email if user exists
    if ($user) {
      // Generate 6-digit password reset code (same as OTP)
      $resetCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
      
      // Store code in users table (same pattern as OTP) - plain text, not hashed
      $user->password_reset_code = $resetCode;
      $user->password_reset_expires_at = Carbon::now()->addMinutes(10);
      $user->save();
      
      \Log::info('Password reset code generated and saved to database for: ' . $user->email . ' | Reset Code: ' . $resetCode);

      // Send password reset code email using same method as OTP
      try {
        $sendGridService = new SendGridService();
        
        // Render email template (same pattern as OTP)
        $htmlContent = view('emails.password-reset-code', [
          'userName' => $user->name,
          'resetCode' => $resetCode
        ])->render();
        
        $textContent = "Hello {$user->name},\n\nWe received a request to reset your password. Please use the following code to reset your password:\n\n{$resetCode}\n\nThis code will expire in 10 minutes. Enter this code on the password reset page to unlock the password reset form.\n\nIf you did not request a password reset, please ignore this email.";
        
        $sent = $sendGridService->sendEmail(
          $user->email,
          'Password Reset Code',
          $htmlContent,
          $textContent
        );
        
        if ($sent) {
          \Log::info('Password reset code email sent via SendGrid API to: ' . $user->email . ' | Reset Code: ' . $resetCode);
        } else {
          // Fallback to SMTP if HTTP API fails (same as OTP)
          try {
            Mail::to($user->email)->send(new \App\Mail\PasswordResetCodeMail($resetCode, $user->name));
            \Log::info('Password reset code email sent via SMTP fallback to: ' . $user->email . ' | Reset Code: ' . $resetCode);
          } catch (\Exception $e) {
            \Log::error('Failed to send password reset code email via both methods to ' . $user->email . ': ' . $e->getMessage());
            \Log::error('Password Reset Code generated but not sent: ' . $resetCode);
          }
        }
      } catch (\Exception $e) {
        // Log error but don't fail the request (same as OTP)
        \Log::error('Failed to send password reset code email to ' . $user->email . ': ' . $e->getMessage());
        \Log::error('Password Reset Code generated but not sent: ' . $resetCode);
      }
    }

    return response()->json([
      'message' => 'If an account exists with that email, we have sent a password reset code.',
      'expires_at' => $user ? $user->password_reset_expires_at->toIso8601String() : null,
    ]);
  }

  /**
   * Verify password reset code (using same pattern as OTP verification)
   */
  public function verifyResetCode(Request $request)
  {
    $request->validate([
      'email' => [
        'required',
        'email',
        'regex:/\.com$/',
      ],
      'code' => 'required|string|size:6',
    ], [
      'email.regex' => 'Confirm your email is correct',
      'code.size' => 'The reset code must be 6 digits.',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user) {
      throw ValidationException::withMessages([
        'code' => ['Invalid or expired reset code.'],
      ]);
    }

    // Check if reset code exists (same pattern as OTP)
    if (!$user->password_reset_code) {
      throw ValidationException::withMessages([
        'code' => ['No reset code found. Please request a new one.'],
      ]);
    }

    // Check if code is expired (10 minutes) - same as OTP
    if ($user->password_reset_expires_at && Carbon::now()->isAfter($user->password_reset_expires_at)) {
      throw ValidationException::withMessages([
        'code' => ['Reset code has expired. Please request a new one.'],
      ]);
    }

    // Check if code matches (plain text comparison, same as OTP)
    if ($user->password_reset_code !== $request->code) {
      throw ValidationException::withMessages([
        'code' => ['Invalid reset code. Please try again.'],
      ]);
    }

    // Code is valid - return success (code will be used in resetPassword)
    return response()->json([
      'message' => 'Reset code verified successfully. You can now set your new password.',
      'verified' => true,
    ]);
  }

  /**
   * Reset password using verified code (using same pattern as OTP)
   */
  public function resetPassword(Request $request)
  {
    $request->validate([
      'email' => [
        'required',
        'email',
        'regex:/\.com$/',
      ],
      'code' => 'required|string|size:6',
      'password' => 'required|string|min:8|confirmed',
    ], [
      'email.regex' => 'Confirm your email is correct',
      'code.size' => 'The reset code must be 6 digits.',
      'password.confirmed' => 'The password confirmation does not match.',
      'password.min' => 'The password must be at least 8 characters.',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user) {
      throw ValidationException::withMessages([
        'email' => ['User not found.'],
      ]);
    }

    // Check if reset code exists (same pattern as OTP)
    if (!$user->password_reset_code) {
      throw ValidationException::withMessages([
        'code' => ['No reset code found. Please request a new one.'],
      ]);
    }

    // Check if code is expired (10 minutes) - same as OTP
    if ($user->password_reset_expires_at && Carbon::now()->isAfter($user->password_reset_expires_at)) {
      throw ValidationException::withMessages([
        'code' => ['Reset code has expired. Please request a new one.'],
      ]);
    }

    // Check if code matches (plain text comparison, same as OTP)
    if ($user->password_reset_code !== $request->code) {
      throw ValidationException::withMessages([
        'code' => ['Invalid reset code. Please try again.'],
      ]);
    }

    // Update password
    $user->password = Hash::make($request->password);
    
    // Clear reset code (same pattern as OTP - clear after use)
    $user->password_reset_code = null;
    $user->password_reset_expires_at = null;
    $user->save();

    return response()->json([
      'message' => 'Password has been reset successfully. You can now login with your new password.',
    ]);
  }
}
