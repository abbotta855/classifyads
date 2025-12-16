<?php

namespace App\Http\Controllers;

use App\Models\Ebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SellerEbookController extends Controller
{
    /**
     * Display a listing of the authenticated seller's eBooks
     */
    public function index()
    {
        $user = Auth::user();
        
        // Only verified sellers can access
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller to manage eBooks'], 403);
        }

        $ebooks = Ebook::with(['category'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($ebooks);
    }

    /**
     * Store a newly created eBook (seller's own)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Only verified sellers can create eBooks
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller to upload eBooks'], 403);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'writer' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'pages' => 'nullable|integer|min:1',
            'book_size' => 'nullable|string|max:50',
            'file_format' => 'nullable|string|max:50',
            'file' => 'required|file|mimes:pdf,epub,mobi,doc,docx|max:102400', // 100MB max
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:20480', // 20MB max
            'price' => 'required|numeric|min:0',
            'publisher_name' => 'nullable|string|max:255',
            'publisher_address' => 'nullable|string',
            'publisher_website' => 'nullable|url|max:500',
            'publisher_email' => 'nullable|email|max:255',
            'publisher_phone' => 'nullable|string|max:50',
            'copyright_declared' => 'required|boolean',
            'book_type' => 'required|in:ebook,hard_copy,both',
            'shipping_cost' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $user->id; // Force seller's own ID

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('ebooks/files', $fileName, 'public');
            $data['file_url'] = Storage::url($path);
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            $coverImage = $request->file('cover_image');
            $coverImageName = time() . '_' . $coverImage->getClientOriginalName();
            $coverPath = $coverImage->storeAs('ebooks/covers', $coverImageName, 'public');
            $data['cover_image'] = Storage::url($coverPath);
        }

        unset($data['file']); // Remove file object
        $data['status'] = 'active';
        
        $ebook = Ebook::create($data);
        return response()->json($ebook->load(['category']), 201);
    }

    /**
     * Display the specified eBook (only if owned by seller)
     */
    public function show(string $id)
    {
        $user = Auth::user();
        
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller'], 403);
        }

        $ebook = Ebook::with(['category'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        return response()->json($ebook);
    }

    /**
     * Update the specified eBook (only if owned by seller)
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller'], 403);
        }

        $ebook = Ebook::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'writer' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'pages' => 'nullable|integer|min:1',
            'book_size' => 'nullable|string|max:50',
            'file_format' => 'nullable|string|max:50',
            'file' => 'sometimes|file|mimes:pdf,epub,mobi,doc,docx|max:102400',
            'cover_image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:20480',
            'price' => 'sometimes|required|numeric|min:0',
            'publisher_name' => 'nullable|string|max:255',
            'publisher_address' => 'nullable|string',
            'publisher_website' => 'nullable|url|max:500',
            'publisher_email' => 'nullable|email|max:255',
            'publisher_phone' => 'nullable|string|max:50',
            'copyright_declared' => 'sometimes|required|boolean',
            'book_type' => 'sometimes|required|in:ebook,hard_copy,both',
            'shipping_cost' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:100',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if ($validator->fails()) {
            \Log::warning('Ebook update validation failed', [
                'ebook_id' => $id,
                'errors' => $validator->errors()->toArray(),
            ]);
            return response()->json([
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle file upload (optional update)
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($ebook->file_url) {
                $oldPath = str_replace('/storage/', '', $ebook->file_url);
                Storage::disk('public')->delete($oldPath);
            }
            
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('ebooks/files', $fileName, 'public');
            $data['file_url'] = Storage::url($path);
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        // Handle cover image upload (optional update)
        if ($request->hasFile('cover_image')) {
            // Delete old cover if exists
            if ($ebook->cover_image) {
                $oldCoverPath = str_replace('/storage/', '', $ebook->cover_image);
                Storage::disk('public')->delete($oldCoverPath);
            }
            
            $coverImage = $request->file('cover_image');
            $coverImageName = time() . '_' . $coverImage->getClientOriginalName();
            $coverPath = $coverImage->storeAs('ebooks/covers', $coverImageName, 'public');
            $data['cover_image'] = Storage::url($coverPath);
        } else {
            // If no new cover uploaded, remove cover_image from data to avoid validation errors
            unset($data['cover_image']);
        }

        unset($data['file']); // Remove file object
        $ebook->update($data);

        return response()->json($ebook->load(['category']));
    }

    /**
     * Remove the specified eBook (only if owned by seller)
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller'], 403);
        }

        $ebook = Ebook::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Delete associated files
        if ($ebook->file_url) {
            $filePath = str_replace('/storage/', '', $ebook->file_url);
            Storage::disk('public')->delete($filePath);
        }
        if ($ebook->cover_image) {
            $coverPath = str_replace('/storage/', '', $ebook->cover_image);
            Storage::disk('public')->delete($coverPath);
        }

        $ebook->delete();

        return response()->json(['message' => 'eBook deleted successfully']);
    }

    /**
     * Get sales report for seller's eBooks
     */
    public function salesReport()
    {
        $user = Auth::user();
        
        if (!$user->seller_verified) {
            return response()->json(['error' => 'You must be a verified seller'], 403);
        }

        $ebooks = Ebook::where('user_id', $user->id)->get();
        
        $totalEbooks = $ebooks->count();
        $totalSales = 0;
        $totalRevenue = 0;
        $totalDownloads = 0;
        
        $salesByEbook = [];
        
        foreach ($ebooks as $ebook) {
            $transactions = \App\Models\Transaction::where('ebook_id', $ebook->id)
                ->where('status', 'completed')
                ->where('type', 'ebook_purchase')
                ->get();
            
            $salesCount = $transactions->count();
            $revenue = $transactions->sum('amount');
            $downloads = $ebook->download_count ?? 0;
            
            $totalSales += $salesCount;
            $totalRevenue += $revenue;
            $totalDownloads += $downloads;
            
            $salesByEbook[] = [
                'ebook_id' => $ebook->id,
                'title' => $ebook->title,
                'price' => $ebook->price,
                'sales_count' => $salesCount,
                'revenue' => $revenue,
                'downloads' => $downloads,
                'overall_rating' => $ebook->overall_rating ?? 0,
            ];
        }
        
        return response()->json([
            'total_ebooks' => $totalEbooks,
            'total_sales' => $totalSales,
            'total_revenue' => $totalRevenue,
            'total_downloads' => $totalDownloads,
            'sales_by_ebook' => $salesByEbook,
        ]);
    }
}

