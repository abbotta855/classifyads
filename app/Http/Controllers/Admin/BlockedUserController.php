<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedUser;
use Illuminate\Http\Request;

class BlockedUserController extends Controller
{
  public function index()
  {
    $blockedUsers = BlockedUser::with('user')
      ->orderBy('date_to_block', 'desc')
      ->get();

    return response()->json($blockedUsers);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'email' => 'required|email',
      'address' => 'nullable|string',
      'date_to_block' => 'required|date',
      'reason_to_block' => 'required|string',
    ]);

    $blockedUser = BlockedUser::create($validated);

    return response()->json($blockedUser, 201);
  }

  public function show(string $id)
  {
    $blockedUser = BlockedUser::with('user')->findOrFail($id);
    return response()->json($blockedUser);
  }

  public function update(Request $request, string $id)
  {
    $blockedUser = BlockedUser::findOrFail($id);

    $validated = $request->validate([
      'user_id' => 'sometimes|exists:users,id',
      'email' => 'sometimes|email',
      'address' => 'sometimes|string',
      'date_to_block' => 'sometimes|date',
      'reason_to_block' => 'sometimes|string',
    ]);

    $blockedUser->update($validated);

    return response()->json($blockedUser);
  }

  public function destroy(string $id)
  {
    $blockedUser = BlockedUser::findOrFail($id);
    $blockedUser->delete();

    return response()->json(['message' => 'Blocked user deleted successfully']);
  }
}
