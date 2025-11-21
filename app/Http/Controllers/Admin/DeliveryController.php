<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
  public function index()
  {
    $deliveries = Delivery::with('sellerVendor')
      ->orderBy('pickup_date', 'desc')
      ->get();

    return response()->json($deliveries);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'seller_vendor_id' => 'required|exists:users,id',
      'item' => 'required|string|max:255',
      'price' => 'required|numeric|min:0',
      'delivery_status' => 'required|in:Pending,In Transit,Delivered',
      'pickup_date' => 'required|date',
    ]);

    $delivery = Delivery::create($validated);

    return response()->json($delivery, 201);
  }

  public function show(string $id)
  {
    $delivery = Delivery::with('sellerVendor')->findOrFail($id);
    return response()->json($delivery);
  }

  public function update(Request $request, string $id)
  {
    $delivery = Delivery::findOrFail($id);

    $validated = $request->validate([
      'seller_vendor_id' => 'sometimes|exists:users,id',
      'item' => 'sometimes|string|max:255',
      'price' => 'sometimes|numeric|min:0',
      'delivery_status' => 'sometimes|in:Pending,In Transit,Delivered',
      'pickup_date' => 'sometimes|date',
    ]);

    $delivery->update($validated);

    return response()->json($delivery);
  }

  public function destroy(string $id)
  {
    $delivery = Delivery::findOrFail($id);
    $delivery->delete();

    return response()->json(['message' => 'Delivery deleted successfully']);
  }
}
