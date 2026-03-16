<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseVerification;
use Illuminate\Http\Request;

class PurchaseVerificationController extends Controller
{
  public function index()
  {
    $purchaseVerifications = PurchaseVerification::with('buyerUser')
      ->orderBy('purchase_date', 'desc')
      ->get();

    return response()->json($purchaseVerifications);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'buyer_user_id' => 'required|exists:users,id',
      'item' => 'required|string|max:255',
      'price' => 'required|numeric|min:0',
      'purchase_date' => 'required|date',
      'verification_code' => 'required|string|unique:purchase_verifications,verification_code',
      'delivery_status' => 'required|in:Pending,In Transit,Delivered,Failed',
    ]);

    $purchaseVerification = PurchaseVerification::create($validated);

    return response()->json($purchaseVerification, 201);
  }

  public function show(string $id)
  {
    $purchaseVerification = PurchaseVerification::with('buyerUser')->findOrFail($id);
    return response()->json($purchaseVerification);
  }

  public function update(Request $request, string $id)
  {
    $purchaseVerification = PurchaseVerification::findOrFail($id);

    $validated = $request->validate([
      'buyer_user_id' => 'sometimes|exists:users,id',
      'item' => 'sometimes|string|max:255',
      'price' => 'sometimes|numeric|min:0',
      'purchase_date' => 'sometimes|date',
      'verification_code' => 'sometimes|string|unique:purchase_verifications,verification_code,' . $id,
      'delivery_status' => 'sometimes|in:Pending,In Transit,Delivered,Failed',
    ]);

    $purchaseVerification->update($validated);

    return response()->json($purchaseVerification);
  }

  public function destroy(string $id)
  {
    $purchaseVerification = PurchaseVerification::findOrFail($id);
    $purchaseVerification->delete();

    return response()->json(['message' => 'Purchase verification deleted successfully']);
  }
}
