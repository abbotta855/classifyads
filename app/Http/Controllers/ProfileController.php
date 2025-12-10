<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Get current user's profile
     */
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }
            $user->load('locationRelation');
            
            // Calculate response rate (only if user has ads)
            $responseRate = null;
            $totalSold = 0;
            $profileRating = null;
            
            $userAds = \App\Models\Ad::where('user_id', $user->id)->get();
            if ($userAds->count() > 0) {
                // Calculate response rate: (Messages responded to / Total messages received) * 100
                $adIds = $userAds->pluck('id');
                
                // Get all buyer messages to this seller
                $buyerMessages = \App\Models\BuyerSellerMessage::whereIn('ad_id', $adIds)
                    ->where('seller_id', $user->id)
                    ->where('sender_type', 'buyer')
                    ->get();
                
                // Get all seller responses (messages sent by seller after a buyer message)
                $sellerResponses = \App\Models\BuyerSellerMessage::whereIn('ad_id', $adIds)
                    ->where('seller_id', $user->id)
                    ->where('sender_type', 'seller')
                    ->get();
                
                // Group buyer messages by ad_id to count unique conversations
                $conversations = $buyerMessages->groupBy('ad_id');
                $respondedConversations = $sellerResponses->pluck('ad_id')->unique();
                
                $totalInquiries = $conversations->count();
                $respondedInquiries = $respondedConversations->count();
                
                if ($totalInquiries > 0) {
                    $responseRate = round(($respondedInquiries / $totalInquiries) * 100, 2);
                } else {
                    $responseRate = null; // No inquiries yet
                }
                
                // Total sold items
                $totalSold = $userAds->where('status', 'sold')->count();
                
                // Profile rating (average rating as seller)
                $ratings = \App\Models\Rating::where('seller_id', $user->id)->get();
                if ($ratings->count() > 0) {
                    $averageRating = $ratings->avg('rating');
                    $totalRatings = $ratings->count();
                    $profileRating = [
                        'average' => round($averageRating, 2),
                        'total' => $totalRatings,
                        'percentage' => round(($averageRating / 5) * 100, 2), // Convert to percentage
                    ];
                }
            }
            
            // Format last login
            $lastLoginFormatted = $this->formatLastLogin($user->last_login_at);
            
            // Safely get show_phone - check if column exists in database
            $showPhone = true; // default value
            if (Schema::hasColumn('users', 'show_phone')) {
                $showPhone = $user->show_phone ?? true;
            }
            
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'dob' => $user->dob,
                'phone' => $user->phone,
                'show_phone' => $showPhone,
                'profile_picture' => $user->profile_picture,
                'location_id' => $user->location_id,
                'selected_local_address' => $user->selected_local_address,
                'locationRelation' => $user->locationRelation,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
                'last_login_formatted' => $lastLoginFormatted,
                'response_rate' => $responseRate,
                'total_sold' => $totalSold,
                'profile_rating' => $profileRating,
                'member_since' => $user->created_at ? $user->created_at->format('M Y') : 'N/A',
            ]);
        } catch (\Exception $e) {
            \Log::error('ProfileController::show error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to load profile',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
    
    /**
     * Format last login time in human-readable format
     */
    private function formatLastLogin($lastLoginAt)
    {
        if (!$lastLoginAt) {
            return 'Never';
        }

        $now = \Carbon\Carbon::now();
        $lastLogin = \Carbon\Carbon::parse($lastLoginAt);
        
        if ($lastLogin->isFuture()) {
            return $lastLogin->format('M d, Y');
        }
        
        $diffInSeconds = $now->diffInSeconds($lastLogin);
        $diffInMinutes = $now->diffInMinutes($lastLogin);
        $diffInHours = $now->diffInHours($lastLogin);
        $diffInDays = $now->diffInDays($lastLogin);
        $diffInWeeks = $now->diffInWeeks($lastLogin);
        $diffInMonths = $now->diffInMonths($lastLogin);
        $diffInYears = $now->diffInYears($lastLogin);
        
        if ($diffInYears > 0) {
            return $diffInYears . ' year' . ($diffInYears > 1 ? 's' : '') . ' ago';
        } elseif ($diffInMonths > 0) {
            return $diffInMonths . ' month' . ($diffInMonths > 1 ? 's' : '') . ' ago';
        } elseif ($diffInWeeks > 0) {
            return $diffInWeeks . ' week' . ($diffInWeeks > 1 ? 's' : '') . ' ago';
        } elseif ($diffInDays > 0) {
            return $diffInDays . ' day' . ($diffInDays > 1 ? 's' : '') . ' ago';
        } elseif ($diffInHours > 0) {
            return $diffInHours . ' hour' . ($diffInHours > 1 ? 's' : '') . ' ago';
        } elseif ($diffInMinutes > 0) {
            return $diffInMinutes . ' minute' . ($diffInMinutes > 1 ? 's' : '') . ' ago';
        } else {
            return 'Just now';
        }
    }

    /**
     * Update current user's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'dob' => 'sometimes|nullable|date',
            'phone' => 'sometimes|nullable|string|max:20',
            'show_phone' => 'sometimes|boolean',
            'location_id' => 'sometimes|nullable|exists:locations,id',
            'selected_local_address' => 'sometimes|nullable|string|max:255',
            'profile_picture' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        
        // Only include show_phone if the column exists in the database
        if (isset($validated['show_phone']) && !Schema::hasColumn('users', 'show_phone')) {
            unset($validated['show_phone']);
        }

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_picture) {
                $oldPath = str_replace('/storage/', '', $user->profile_picture);
                Storage::disk('public')->delete($oldPath);
            }

            // Store new profile picture
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $validated['profile_picture'] = Storage::url($path);
        }

        // Update user with validated data
        $user->update($validated);
        
        // Refresh user to get updated data
        $user->refresh();
        $user->load('locationRelation');

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Change current user's password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Current password is required.',
            'new_password.required' => 'New password is required.',
            'new_password.min' => 'The new password must be at least 8 characters.',
            'new_password.confirmed' => 'The new password confirmation does not match.',
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
