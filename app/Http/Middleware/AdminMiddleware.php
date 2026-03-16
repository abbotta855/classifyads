<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Ensure the user is admin or super admin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // auth:sanctum middleware should have already authenticated the user
        $user = Auth::user();

        if (!$user) {
            abort(403, 'Unauthorized action. User not authenticated.');
        }

        // Get role - access as Eloquent attribute
        $role = $user->role ?? null;
        if ($role) {
            $role = strtolower(str_replace(' ', '_', trim($role)));
        }

        $isAdmin = (
            (method_exists($user, 'isAdmin') && $user->isAdmin()) ||
            (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) ||
            in_array($role, ['admin', 'super_admin', 'superadmin'])
        );

        if (!$isAdmin) {
            abort(403, 'Unauthorized action. User role: ' . ($role ?? 'unknown') . ', User ID: ' . $user->id);
        }

        return $next($request);
    }
}

