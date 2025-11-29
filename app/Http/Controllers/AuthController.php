<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
      'user' => $user,
      'token' => $token,
      'message' => 'Registration successful',
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
   * Change password for super_admin only
   */
  public function changePassword(Request $request)
  {
    // Only super_admin can change password through this endpoint
    if ($request->user()->role !== 'super_admin') {
      return response()->json([
        'message' => 'Unauthorized. Only super admin can change password.',
      ], 403);
    }

    $validated = $request->validate([
      'current_password' => 'required|string',
      'new_password' => 'required|string|min:8|confirmed',
    ], [
      'new_password.confirmed' => 'The new password confirmation does not match.',
      'new_password.min' => 'The new password must be at least 8 characters.',
    ]);

    $user = $request->user();

    // Verify current password
    if (!Hash::check($validated['current_password'], $user->password)) {
      return response()->json([
        'message' => 'Current password is incorrect.',
      ], 422);
    }

    // Update password
    $user->password = Hash::make($validated['new_password']);
    $user->save();

    return response()->json([
      'message' => 'Password changed successfully.',
    ]);
  }
}
