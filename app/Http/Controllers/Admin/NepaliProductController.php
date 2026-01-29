<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NepaliProduct;
use App\Mail\NepaliProductStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NepaliProductController extends Controller
{
    /**
     * List all Nepali products for admin review
     */
    public function index(Request $request)
    {
        $status = $request->get('status'); // Filter by status: pending, approved, rejected
        
        $query = NepaliProduct::with(['user', 'category', 'subcategory', 'images'])
            ->orderByDesc('created_at');
        
        if ($status) {
            $query->where('status', $status);
        }
        
        $products = $query->paginate(24);
        
        // Transform to include image URLs
        $products->getCollection()->transform(function ($product) {
            $product->primary_image = $product->images()->orderBy('image_order')->first()?->image_url;
            return $product;
        });
        
        return response()->json($products);
    }
    
    /**
     * Show a single product for review
     */
    public function show($id)
    {
        $product = NepaliProduct::with(['user', 'category', 'subcategory', 'images', 'ratings.user'])
            ->findOrFail($id);
        
        // Transform images to include URLs
        $product->images->transform(function ($image) {
            return [
                'id' => $image->id,
                'image_url' => $image->image_url,
                'image_order' => $image->image_order,
            ];
        });
        
        return response()->json($product);
    }
    
    /**
     * Approve a product
     */
    public function approve(Request $request, $id)
    {
        $product = NepaliProduct::with('user')->findOrFail($id);
        
        $product->update([
            'status' => 'approved',
        ]);
        
        // Send email notification to product owner
        try {
            if ($product->user && $product->user->email) {
                Mail::to($product->user->email)->send(
                    new NepaliProductStatusNotification($product->fresh(), 'approved')
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send product approval email', [
                'product_id' => $product->id,
                'user_id' => $product->user_id,
                'error' => $e->getMessage(),
            ]);
        }
        
        return response()->json([
            'message' => 'Product approved successfully',
            'product' => $product->load(['user', 'category', 'subcategory', 'images']),
        ]);
    }
    
    /**
     * Reject a product
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);
        
        $product = NepaliProduct::with('user')->findOrFail($id);
        $reason = $request->input('reason');
        
        $product->update([
            'status' => 'rejected',
        ]);
        
        // Send email notification to product owner
        try {
            if ($product->user && $product->user->email) {
                Mail::to($product->user->email)->send(
                    new NepaliProductStatusNotification($product->fresh(), 'rejected', $reason)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send product rejection email', [
                'product_id' => $product->id,
                'user_id' => $product->user_id,
                'error' => $e->getMessage(),
            ]);
        }
        
        return response()->json([
            'message' => 'Product rejected successfully',
            'product' => $product->load(['user', 'category', 'subcategory', 'images']),
        ]);
    }
    
    /**
     * Delete a product (admin only)
     */
    public function destroy($id)
    {
        $product = NepaliProduct::findOrFail($id);
        $product->delete();
        
        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}

