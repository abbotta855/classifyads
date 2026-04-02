<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    private function isNepaliRequest(Request $request): bool
    {
        $lang = strtolower((string) ($request->header('X-Language') ?? $request->query('lang', 'en')));
        return str_starts_with($lang, 'ne');
    }

    /**
     * Get all locations in hierarchical format (Province → District → Local Level)
     */
    public function index(Request $request)
    {
        $isNepali = $this->isNepaliRequest($request);
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
            $provinceName = $isNepali ? ($location->province_ne ?: $location->province) : $location->province;
            $districtName = $isNepali ? ($location->district_ne ?: $location->district) : $location->district;
            $localLevelName = $isNepali ? ($location->local_level_ne ?: $location->local_level) : $location->local_level;
            $localLevelType = $location->local_level_type;
            $rawProvince = $location->province;
            $rawDistrict = $location->district;
            $rawLocalLevel = $location->local_level;

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
                $wards = Location::where('province', $rawProvince)
                    ->where('district', $rawDistrict)
                    ->where('local_level', $rawLocalLevel)
                    ->orderBy('ward_number')
                    ->get(['id', 'ward_number', 'local_address', 'local_address_ne']);
                
                $wardsData = [];
                foreach ($wards as $ward) {
                    $addressValue = $isNepali ? ($ward->local_address_ne ?: $ward->local_address) : $ward->local_address;
                    $localAddresses = $addressValue ? explode(', ', $addressValue) : [];
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
