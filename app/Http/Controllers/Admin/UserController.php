<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
  public function index()
  {
    $users = User::orderBy('created_at', 'desc')->get()->map(function ($user) {
      return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'location' => $user->location,
        'comment' => $user->comment,
        'created_at' => $user->created_at,
        'updated_at' => $user->updated_at,
      ];
    });

    // Get total counts
    $totalUsers = User::where('role', 'user')->count();
    $totalVendors = User::where('role', 'vendor')->count();

    return response()->json([
      'users' => $users,
      'total_users' => $totalUsers,
      'total_vendors' => $totalVendors,
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|email|unique:users,email',
      'password' => 'required|string|min:8',
      'role' => 'required|in:admin,user,vendor',
    ]);

    $validated['password'] = Hash::make($validated['password']);

    $user = User::create($validated);

    return response()->json($user, 201);
  }

  public function show(string $id)
  {
    $user = User::findOrFail($id);
    return response()->json($user);
  }

  public function update(Request $request, string $id)
  {
    $user = User::findOrFail($id);

    // Prevent editing super_admin users through this endpoint
    if ($user->role === 'super_admin') {
      return response()->json(['error' => 'Super admin users cannot be edited through this interface.'], 403);
    }

    $validated = $request->validate([
      'name' => 'sometimes|string|max:255',
      'email' => 'sometimes|email|unique:users,email,' . $id,
      'password' => 'sometimes|string|min:8',
      'role' => 'sometimes|in:admin,user,vendor',
      'comment' => 'sometimes|nullable|string',
      'location' => 'sometimes|nullable|string',
    ]);

    // Prevent changing role to super_admin
    if (isset($validated['role']) && $validated['role'] === 'super_admin') {
      return response()->json(['error' => 'Cannot set user role to super_admin through this interface.'], 403);
    }

    if (isset($validated['password'])) {
      $validated['password'] = Hash::make($validated['password']);
    }

    // If comment is being updated, create a notification
    if (isset($validated['comment']) && $validated['comment'] !== $user->comment) {
      $admin = Auth::user();
      
      Notification::create([
        'user_id' => $user->id,
        'type' => 'comment',
        'title' => 'Admin Comment',
        'message' => $validated['comment'] ?: 'Your comment has been cleared by admin.',
        'is_read' => false,
        'created_by' => $admin->id,
      ]);
    }

    $user->update($validated);

    return response()->json($user);
  }

  /**
   * Add or update comment for a user
   */
  public function addComment(Request $request, string $id)
  {
    $user = User::findOrFail($id);
    $admin = Auth::user();

    $validated = $request->validate([
      'comment' => 'required|string',
    ]);

    $user->update(['comment' => $validated['comment']]);

    // Create notification for the user
    Notification::create([
      'user_id' => $user->id,
      'type' => 'comment',
      'title' => 'Admin Comment',
      'message' => $validated['comment'],
      'is_read' => false,
      'created_by' => $admin->id,
    ]);

    return response()->json([
      'message' => 'Comment added successfully and notification sent to user',
      'user' => $user,
    ]);
  }

  public function destroy(string $id)
  {
    $user = User::findOrFail($id);
    
    // Prevent deleting super_admin users
    if ($user->role === 'super_admin') {
      return response()->json(['error' => 'Super admin users cannot be deleted.'], 403);
    }

    $user->delete();

    return response()->json(['message' => 'User deleted successfully']);
  }
}
