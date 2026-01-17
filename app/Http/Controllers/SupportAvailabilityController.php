<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SupportAvailabilityController extends Controller
{
    private const MANUAL_KEY = 'support:availability:manual';
    private const LAST_SEEN_KEY = 'support:availability:last_seen';
    private const TTL_MINUTES = 5;

    /**
     * Public status endpoint.
     */
    public function status()
    {
        $manual = Cache::get(self::MANUAL_KEY);
        $lastSeen = Cache::get(self::LAST_SEEN_KEY);

        $onlineByPresence = $lastSeen && now()->diffInMinutes($lastSeen) < self::TTL_MINUTES;
        $online = $manual === null ? $onlineByPresence : (bool) $manual;

        return response()->json([
            'online' => $online,
            'last_seen' => $lastSeen,
            'source' => $manual === null ? 'presence' : 'manual',
        ]);
    }

    /**
     * Admin can toggle availability (manual override) and refresh heartbeat.
     */
    public function setAvailability(Request $request)
    {
        $validated = $request->validate([
            'online' => 'required|boolean',
        ]);

        Cache::put(self::MANUAL_KEY, $validated['online'], now()->addMinutes(self::TTL_MINUTES));
        Cache::put(self::LAST_SEEN_KEY, now(), now()->addMinutes(self::TTL_MINUTES));

        return response()->json([
            'online' => $validated['online'],
            'source' => 'manual',
        ]);
    }
}
