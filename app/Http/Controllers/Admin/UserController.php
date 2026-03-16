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
    $users = User::with('locationRelation')->orderBy('created_at', 'desc')->get()->map(function ($user) {
      $locationString = null;
      if ($user->locationRelation) {
        $parts = [];
        if ($user->locationRelation->province) $parts[] = $user->locationRelation->province;
        if ($user->locationRelation->district) $parts[] = $user->locationRelation->district;
        if ($user->locationRelation->local_level) $parts[] = $user->locationRelation->local_level;
        
        // Only show ward number if selected_local_address is null (meaning user selected a specific ward, not just local level)
        // If selected_local_address exists, it means user selected a specific address, so show ward + address
        // If selected_local_address is null but location_id exists, it might mean user selected only up to local level
        // For now, we'll show ward if no selected_local_address (user selected a ward but not a specific address)
        // But if we want to support "local level only" selection, we'd need an additional flag
        
        // Show ward number only if there's no selected_local_address (user selected ward but not specific address)
        // If selected_local_address is null, it means user selected ward level, so show ward
        // If selected_local_address exists, it means user selected a specific address, so show ward + address
        // Check if selected_local_address is a special marker for "local level only"
        if ($user->selected_local_address === '__LOCAL_LEVEL_ONLY__') {
          // User selected only local level, not a specific ward - don't show ward number
          // Location string will be: Province > District > Local Level
        } elseif ($user->locationRelation->ward_number && $user->selected_local_address === null) {
          // User selected a ward but not a specific address - show ward
          $parts[] = 'Ward ' . $user->locationRelation->ward_number;
        } elseif ($user->locationRelation->ward_number && $user->selected_local_address) {
          // User selected a specific address - show ward + address
          $parts[] = 'Ward ' . $user->locationRelation->ward_number;
          $parts[] = $user->selected_local_address;
        }
        // If ward_number is null, don't show ward
        
        $locationString = count($parts) > 0 ? implode(' > ', $parts) : null;
      }
      
      return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        // Expose seller verification fields so admin panel can show correct status
        'seller_verified' => $user->seller_verified,
        'seller_verification_fee_paid' => $user->seller_verification_fee_paid,
        'seller_verified_at' => $user->seller_verified_at,
        'location' => $locationString ?: null,
        'location_id' => $user->location_id,
        'selected_local_address' => $user->selected_local_address,
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

    // Prevent creating super_admin through this interface
    if (isset($validated['role']) && $validated['role'] === 'super_admin') {
      return response()->json(['error' => 'Cannot create super_admin through this interface. Use artisan command or seeder.'], 403);
    }

    // Check if trying to create super_admin (shouldn't happen due to validation, but double-check)
    if ($validated['role'] === 'super_admin') {
      // Check if super admin already exists
      $existingSuperAdmin = User::where('role', 'super_admin')->first();
      if ($existingSuperAdmin) {
        return response()->json(['error' => 'Super admin already exists. Only 1 super admin is allowed.'], 403);
      }
    }

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
    $currentUser = Auth::user();

    // Prevent editing super_admin users through this endpoint
    if ($user->role === 'super_admin') {
      return response()->json(['error' => 'Super admin users cannot be edited through this interface.'], 403);
    }

    // Prevent regular admins from editing other admin accounts
    if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
      return response()->json(['error' => 'Regular admins cannot edit other admin accounts. Only super admins can manage admin accounts.'], 403);
    }

    $validated = $request->validate([
      'name' => 'sometimes|string|max:255',
      'email' => 'sometimes|email|unique:users,email,' . $id,
      'password' => 'sometimes|string|min:8',
      'role' => 'sometimes|in:admin,user,vendor',
      'comment' => 'sometimes|nullable|string',
      'location_id' => 'sometimes|nullable|exists:locations,id',
      'selected_local_address' => 'sometimes|nullable|string|max:255',
    ]);

    // Prevent changing role to super_admin
    if (isset($validated['role']) && $validated['role'] === 'super_admin') {
      // Check if super admin already exists
      $existingSuperAdmin = User::where('role', 'super_admin')->where('id', '!=', $id)->first();
      if ($existingSuperAdmin) {
        return response()->json(['error' => 'Super admin already exists. Only 1 super admin is allowed.'], 403);
      }
      return response()->json(['error' => 'Cannot set user role to super_admin through this interface. Use artisan command or seeder.'], 403);
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

    // Prevent regular admins from adding comments to admin/super_admin accounts
    if (($user->role === 'admin' || $user->role === 'super_admin') && $admin->role !== 'super_admin') {
      return response()->json(['error' => 'Regular admins cannot add comments to admin accounts. Only super admins can manage admin accounts.'], 403);
    }

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
    $currentUser = Auth::user();
    
    // Prevent deleting super_admin users
    if ($user->role === 'super_admin') {
      return response()->json(['error' => 'Super admin users cannot be deleted.'], 403);
    }

    // Prevent regular admins from deleting other admin accounts
    if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
      return response()->json(['error' => 'Regular admins cannot delete other admin accounts. Only super admins can manage admin accounts.'], 403);
    }

    $user->delete();

    return response()->json(['message' => 'User deleted successfully']);
  }
}
