<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Controllers\OtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

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

    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'password' => Hash::make($request->password),
      'role' => 'user', // Default role for new registrations
      'is_verified' => false, // User needs to verify via OTP
    ]);

    // Generate and send OTP
    $otpController = new OtpController();
    $otpRequest = new Request(['email' => $user->email]);
    $otpResponse = $otpController->generate($otpRequest);

    return response()->json([
      'user' => $user->only(['id', 'name', 'email', 'is_verified']),
      'message' => 'Registration successful. Please check your email for OTP verification code.',
      'requires_verification' => true,
    ], 201);
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

    // Check if user is verified
    if (!$user->is_verified) {
      // Automatically generate and send OTP when unverified user tries to login
      try {
        $otpController = new OtpController();
        $otpRequest = new Request(['email' => $user->email]);
        $otpResponse = $otpController->generate($otpRequest);
      } catch (\Exception $e) {
        \Log::error('Failed to send OTP during login: ' . $e->getMessage());
        // Continue even if OTP sending fails - user can resend
      }
      
      return response()->json([
        'message' => 'Please verify your email address before logging in. A new OTP code has been sent to your email.',
        'requires_verification' => true,
        'user' => $user->only(['id', 'name', 'email', 'is_verified']),
      ], 403);
    }

    // Check if user hasn't logged in for more than 24 hours
    $requiresOtpForInactivity = false;
    if ($user->last_login_at) {
      $hoursSinceLastLogin = Carbon::now()->diffInHours($user->last_login_at);
      if ($hoursSinceLastLogin >= 24) {
        $requiresOtpForInactivity = true;
      }
    } else {
      // If last_login_at is null (first time login after verification), require OTP
      $requiresOtpForInactivity = true;
    }

    // If user hasn't logged in for 24+ hours, require OTP verification
    if ($requiresOtpForInactivity) {
      try {
        $otpController = new OtpController();
        $otpRequest = new Request(['email' => $user->email]);
        $otpResponse = $otpController->generate($otpRequest);
      } catch (\Exception $e) {
        \Log::error('Failed to send OTP during login: ' . $e->getMessage());
        // Continue even if OTP sending fails - user can resend
      }
      
      return response()->json([
        'message' => 'For security purposes, please verify your identity. An OTP code has been sent to your email.',
        'requires_verification' => true,
        'verification_reason' => 'inactivity', // Flag to indicate this is for inactivity, not initial verification
        'user' => $user->only(['id', 'name', 'email', 'is_verified']),
      ], 403);
    }

    // Update last login timestamp
    $user->last_login_at = Carbon::now();
    $user->save();

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
      'user' => $user,
      'token' => $token,
      'message' => 'Login successful',
    ]);
  }

  public function logout(Request $request)
  {
    $request->user()->currentAccessToken()->delete();

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

    // Prevent changing super_admin passwords
    if ($targetUser->role === 'super_admin') {
      return response()->json([
        'message' => 'Cannot change password for super admin accounts.',
      ], 403);
    }

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
}
