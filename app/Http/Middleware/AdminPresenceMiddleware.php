<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AdminPresenceMiddleware
{
    private const TTL_MINUTES = 5;
    private const LAST_SEEN_KEY = 'support:availability:last_seen';

    /**
     * Record a heartbeat for any authenticated admin/super admin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = Auth::user();
        $isAdmin = $user && (
            (method_exists($user, 'isAdmin') && $user->isAdmin()) ||
            (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) ||
            (property_exists($user, 'role') && in_array($user->role, ['admin', 'super_admin']))
        );

        if ($isAdmin) {
            Cache::put(self::LAST_SEEN_KEY, now(), now()->addMinutes(self::TTL_MINUTES));
        }

        return $response;
    }
}
