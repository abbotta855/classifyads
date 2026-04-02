<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\NepaliAutoTranslationService;
use Illuminate\Http\Request;

class LocationController extends Controller
{
  private function isNepaliRequest(Request $request): bool
  {
    $lang = strtolower((string) ($request->header('X-Language') ?? $request->query('lang', 'en')));
    return str_starts_with($lang, 'ne');
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request)
  {
    $isNepali = $this->isNepaliRequest($request);
    $translator = $isNepali ? app(NepaliAutoTranslationService::class) : null;
    $locations = Location::orderBy('province')
      ->orderBy('district')
      ->orderBy('local_level')
      ->orderBy('id', 'asc') // Within same hierarchy, newest at bottom
      ->get()
      ->map(function ($location) use ($isNepali, $translator) {
        if (!$isNepali) {
          return $location;
        }

        $location->province = $location->province_ne ?: $translator->translateToNepali($location->province);
        $location->district = $location->district_ne ?: $translator->translateToNepali($location->district);
        $location->local_level = $location->local_level_ne ?: $translator->translateToNepali($location->local_level);
        $location->local_level_type = $location->local_level_type_ne ?: $translator->translateToNepali($location->local_level_type);
        $location->local_address = $location->local_address_ne ?: $translator->translateToNepali($location->local_address);
        return $location;
      });

    return response()->json($locations);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $translator = app(NepaliAutoTranslationService::class);
    $validated = $request->validate([
      'province' => 'required|string|max:255',
      'district' => 'required|string|max:255',
      'local_level' => 'required|string|max:255',
      'local_level_type' => 'required|in:Metropolitan City,Sub-Metropolitan City,Municipality,Rural Municipality',
      'ward_number' => 'nullable|integer|min:1',
      'local_address' => 'nullable|string|max:500',
    ]);

    $location = Location::create([
      ...$validated,
      'province_ne' => $translator->translateToNepali($validated['province']),
      'district_ne' => $translator->translateToNepali($validated['district']),
      'local_level_ne' => $translator->translateToNepali($validated['local_level']),
      'local_level_type_ne' => $translator->translateToNepali($validated['local_level_type']),
      'local_address_ne' => $translator->translateToNepali($validated['local_address'] ?? null),
    ]);

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
    $translator = app(NepaliAutoTranslationService::class);
    $location = Location::findOrFail($id);

    $validated = $request->validate([
      'province' => 'sometimes|string|max:255',
      'district' => 'sometimes|string|max:255',
      'local_level' => 'sometimes|string|max:255',
      'local_level_type' => 'sometimes|in:Metropolitan City,Sub-Metropolitan City,Municipality,Rural Municipality',
      'ward_number' => 'sometimes|nullable|integer|min:1',
      'local_address' => 'sometimes|nullable|string|max:500',
    ]);

    if (isset($validated['province'])) {
      $validated['province_ne'] = $translator->translateToNepali($validated['province']);
    }
    if (isset($validated['district'])) {
      $validated['district_ne'] = $translator->translateToNepali($validated['district']);
    }
    if (isset($validated['local_level'])) {
      $validated['local_level_ne'] = $translator->translateToNepali($validated['local_level']);
    }
    if (isset($validated['local_level_type'])) {
      $validated['local_level_type_ne'] = $translator->translateToNepali($validated['local_level_type']);
    }
    if (array_key_exists('local_address', $validated)) {
      $validated['local_address_ne'] = $translator->translateToNepali($validated['local_address'] ?? null);
    }

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
