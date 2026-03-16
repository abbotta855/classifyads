<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Get all locations in hierarchical format (Province → District → Local Level)
     */
    public function index()
    {
        // Get all locations from database
        $locations = Location::orderBy('province')
            ->orderBy('district')
            ->orderBy('local_level')
            ->get();

        // Build hierarchical structure
        $provinces = [];
        $provinceMap = [];
        $districtMap = [];

        foreach ($locations as $location) {
            $provinceName = $location->province;
            $districtName = $location->district;
            $localLevelName = $location->local_level;
            $localLevelType = $location->local_level_type;

            // Create province if it doesn't exist
            if (!isset($provinceMap[$provinceName])) {
                $provinceId = count($provinces) + 1;
                $provinceMap[$provinceName] = $provinceId;
                $provinces[] = [
                    'id' => $provinceId,
                    'name' => $provinceName,
                    'districts' => []
                ];
            }

            $provinceIndex = $provinceMap[$provinceName] - 1;
            $province = &$provinces[$provinceIndex];

            // Create district if it doesn't exist
            $districtKey = $provinceName . '|' . $districtName;
            if (!isset($districtMap[$districtKey])) {
                $districtId = count($province['districts']) + 1;
                $districtMap[$districtKey] = $districtId;
                $province['districts'][] = [
                    'id' => $districtId,
                    'name' => $districtName,
                    'localLevels' => []
                ];
            }

            $districtIndex = $districtMap[$districtKey] - 1;
            $district = &$province['districts'][$districtIndex];

            // Add local level if it doesn't exist
            $localLevelExists = false;
            foreach ($district['localLevels'] as $existingLocalLevel) {
                if ($existingLocalLevel['name'] === $localLevelName) {
                    $localLevelExists = true;
                    break;
                }
            }

            if (!$localLevelExists) {
                $localLevelId = count($district['localLevels']) + 1;
                // Convert local_level_type to frontend format
                $type = 'municipality'; // default
                if ($localLevelType === 'Rural Municipality') {
                    $type = 'rural_municipality';
                } elseif (in_array($localLevelType, ['Metropolitan City', 'Sub-Metropolitan City', 'Municipality'])) {
                    $type = 'municipality';
                }
                
                // Get all wards for this local level
                $wards = Location::where('province', $provinceName)
                    ->where('district', $districtName)
                    ->where('local_level', $localLevelName)
                    ->orderBy('ward_number')
                    ->get(['id', 'ward_number', 'local_address']);
                
                $wardsData = [];
                foreach ($wards as $ward) {
                    $localAddresses = $ward->local_address ? explode(', ', $ward->local_address) : [];
                    $wardsData[] = [
                        'id' => $ward->id,
                        'ward_number' => $ward->ward_number,
                        'local_addresses' => $localAddresses
                    ];
                }
                
                $district['localLevels'][] = [
                    'id' => $localLevelId,
                    'name' => $localLevelName,
                    'type' => $type,
                    'wards' => $wardsData
                ];
            }
        }

        return response()->json([
            'provinces' => $provinces
        ]);
    }
}
