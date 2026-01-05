<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SupportAvailabilityController extends Controller
{
    private const CACHE_KEY = 'support_online';
    private const CACHE_TTL_MINUTES = 60;

    /**
     * Get support availability status (public)
     */
    public function status()
    {
        $online = Cache::get(self::CACHE_KEY, false);
        return response()->json(['online' => (bool) $online]);
    }

    /**
     * Set support availability (admin-only)
     */
    public function setStatus(Request $request)
    {
        $request->validate([
            'online' => 'required|boolean',
        ]);

        Cache::put(self::CACHE_KEY, $request->online, now()->addMinutes(self::CACHE_TTL_MINUTES));

        return response()->json(['online' => $request->online]);
    }
}


