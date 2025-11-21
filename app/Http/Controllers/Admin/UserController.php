<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
  public function index()
  {
    $users = User::orderBy('created_at', 'desc')->get();

    return response()->json($users);
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

    $validated = $request->validate([
      'name' => 'sometimes|string|max:255',
      'email' => 'sometimes|email|unique:users,email,' . $id,
      'password' => 'sometimes|string|min:8',
      'role' => 'sometimes|in:admin,user,vendor',
    ]);

    if (isset($validated['password'])) {
      $validated['password'] = Hash::make($validated['password']);
    }

    $user->update($validated);

    return response()->json($user);
  }

  public function destroy(string $id)
  {
    $user = User::findOrFail($id);
    $user->delete();

    return response()->json(['message' => 'User deleted successfully']);
  }
}
