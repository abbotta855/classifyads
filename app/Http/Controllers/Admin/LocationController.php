<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    $locations = Location::orderBy('province')
      ->orderBy('district')
      ->orderBy('local_level')
      ->orderBy('id', 'asc') // Within same hierarchy, newest at bottom
      ->get();

    return response()->json($locations);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'province' => 'required|string|max:255',
      'district' => 'required|string|max:255',
      'local_level' => 'required|string|max:255',
      'local_level_type' => 'required|in:Metropolitan City,Sub-Metropolitan City,Municipality,Rural Municipality',
    ]);

    $location = Location::create($validated);
    // ward_id is automatically set by database trigger to match id
    
    // Refresh to get the updated ward_id from the database
    $location->refresh();

    return response()->json($location, 201);
  }

  /**
   * Display the specified resource.
   */
  public function show(string $id)
  {
    $location = Location::findOrFail($id);
    return response()->json($location);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id)
  {
    $location = Location::findOrFail($id);

    $validated = $request->validate([
      'province' => 'sometimes|string|max:255',
      'district' => 'sometimes|string|max:255',
      'local_level' => 'sometimes|string|max:255',
      'local_level_type' => 'sometimes|in:Metropolitan City,Sub-Metropolitan City,Municipality,Rural Municipality',
    ]);

    $location->update($validated);

    return response()->json($location);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id)
  {
    $location = Location::findOrFail($id);
    $location->delete();

    return response()->json(['message' => 'Location deleted successfully']);
  }
}
