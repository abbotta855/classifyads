<?php

namespace App\Http\Controllers;

use App\Models\Ebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EbookController extends Controller
{
    /**
     * Display a listing of active eBooks
     */
    public function index(Request $request)
    {
        $query = Ebook::with(['user', 'category'])
            ->where('status', 'active');

        // Search by title or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('writer', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by book type
        if ($request->has('book_type')) {
            $query->where('book_type', $request->book_type)
                  ->orWhere('book_type', 'both');
        }

        $ebooks = $query->orderBy('created_at', 'desc')->paginate(20);

        // Add purchase status for authenticated users
        if (Auth::check()) {
            foreach ($ebooks->items() as $ebook) {
                $ebook->is_purchased = $ebook->isPurchasedBy(Auth::id());
                $ebook->verification_code = $ebook->getVerificationCodeForUser(Auth::id());
            }
        }

        return response()->json($ebooks);
    }

    /**
     * Display the specified eBook
     */
    public function show(string $id)
    {
        $ebook = Ebook::with(['user', 'category'])->findOrFail($id);

        // Add purchase status for authenticated users
        if (Auth::check()) {
            $ebook->is_purchased = $ebook->isPurchasedBy(Auth::id());
            $ebook->verification_code = $ebook->getVerificationCodeForUser(Auth::id());
        } else {
            $ebook->is_purchased = false;
            $ebook->verification_code = null;
        }

        // Get positive feedback (ratings >= 4 stars) with user photos
        $positiveReviews = \App\Models\Rating::with(['user'])
            ->where('ebook_id', $id)
            ->where('rating', '>=', 4) // 4 or 5 stars
            ->whereNotNull('comment') // Must have a comment
            ->orderBy('rating', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10) // Get more than 3 to have options
            ->get()
            ->map(function ($rating) {
                return [
                    'id' => $rating->id,
                    'user_name' => $rating->user->name ?? 'Anonymous',
                    'user_profile_picture' => $rating->user->profile_picture ?? null,
                    'rating' => $rating->rating,
                    'comment' => $rating->comment,
                    'created_at' => $rating->created_at,
                    'purchase_verified' => $rating->purchase_verified,
                ];
            })
            ->take(3) // Return at least 3, but show up to 3
            ->values();

        $ebook->positive_feedback = $positiveReviews;

        return response()->json($ebook);
    }

    /**
     * Download the eBook file (only for purchasers)
     */
    public function download(string $id)
    {
        $ebook = Ebook::findOrFail($id);

        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Check if user has purchased this eBook
        if (!$ebook->isPurchasedBy(Auth::id())) {
            return response()->json(['error' => 'You must purchase this eBook before downloading'], 403);
        }

        // Get file path
        $filePath = str_replace('/storage/', '', $ebook->file_url);
        $fullPath = storage_path('app/public/' . $filePath);

        if (!Storage::disk('public')->exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        // Increment download count
        $ebook->increment('download_count');

        // Return file download
        return Storage::disk('public')->download($filePath, $ebook->file_name ?? 'ebook.' . pathinfo($filePath, PATHINFO_EXTENSION));
    }
}
