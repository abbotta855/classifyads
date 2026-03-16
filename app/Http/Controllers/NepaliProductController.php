<?php

namespace App\Http\Controllers;

use App\Models\NepaliProduct;
use App\Models\NepaliProductImage;
use App\Models\NepaliProductRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class NepaliProductController extends Controller
{
    /**
     * List all approved Nepali products (paginated, 24 per page for 4 per row)
     */
    public function index(Request $request)
    {
        // Try to get authenticated user (Sanctum works on public routes if token is provided)
        // Use auth() helper which automatically checks Sanctum tokens
        $user = auth('sanctum')->user();
        
        // Cache key based on user and filters
        $cacheKey = 'nepali_products_' . ($user ? $user->id : 'guest') . '_' . md5(json_encode($request->all()));
        
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($user, $request) {
            $query = NepaliProduct::with(['user', 'category', 'subcategory', 'images'])
                ->where(function ($q) use ($user) {
                    // Show approved products to everyone
                    $q->where('status', 'approved');
                    
                    // Also show pending/rejected products if user is the owner or admin
                    if ($user) {
                        $q->orWhere(function ($subQ) use ($user) {
                            $subQ->where('user_id', $user->id)
                                ->whereIn('status', ['pending', 'rejected']);
                        });
                        
                        // Admins can see all products
                        if (in_array($user->role, ['admin', 'super_admin'])) {
                            $q->orWhereIn('status', ['pending', 'rejected']);
                        }
                    }
                })
                ->orderByDesc('created_at');

            // Filter by category if provided
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by subcategory if provided
            if ($request->has('subcategory_id')) {
                $query->where('subcategory_id', $request->subcategory_id);
            }

            // Search (accept both 'search' and 'q' parameters)
            $searchTerm = $request->get('search') ?? $request->get('q');
            if ($searchTerm) {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('company_name', 'like', "%{$searchTerm}%")
                      ->orWhere('production_items', 'like', "%{$searchTerm}%");
                });
            }

            $products = $query->paginate(24);

            // Transform to include image URLs
            $products->getCollection()->transform(function ($product) {
                $product->primary_image = $product->images()->orderBy('image_order')->first()?->image_url;
                return $product;
            });

            return response()->json($products);
        });
    }

    /**
     * Show a single product (by slug or ID)
     */
    public function show(Request $request, $id)
    {
        // Try to get authenticated user
        $user = auth('sanctum')->user();
        
        // Try to find by slug first, then by ID
        $product = NepaliProduct::with([
            'user',
            'category',
            'subcategory',
            'images',
            'ratings.user'
        ])->where('slug', $id)->first();
        
        // If not found by slug, try by ID
        if (!$product && is_numeric($id)) {
            $product = NepaliProduct::with([
                'user',
                'category',
                'subcategory',
                'images',
                'ratings.user'
            ])->where('id', $id)->first();
        }
        
        if (!$product) {
            abort(404, 'Product not found');
        }

        // Check if product is visible to this user
        // Show approved products to everyone
        // Show pending/rejected products only to owner or admins
        if ($product->status !== 'approved') {
            if (!$user) {
                abort(404, 'Product not found');
            }
            
            $isOwner = $product->user_id === $user->id;
            $isAdmin = in_array($user->role, ['admin', 'super_admin']);
            
            if (!$isOwner && !$isAdmin) {
                abort(404, 'Product not found');
            }
        }

        // Increment view count
        $product->incrementViews();

        // Transform images to include URLs
        $product->images->transform(function ($image) {
            $image->image_url = $image->image_url;
            return $image;
        });

        return response()->json($product);
    }

    /**
     * Store a new product
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:150',
                'company_name' => 'required|string|max:255',
                'company_history' => 'nullable|string|max:2000',
                'company_address' => 'required|string',
                'company_latitude' => 'nullable|numeric|between:-90,90',
                'company_longitude' => 'nullable|numeric|between:-180,180',
                'category_id' => 'required|exists:categories,id',
                'subcategory_id' => 'nullable|exists:categories,id',
                'production_items' => 'required|string|max:255',
                'materials_use' => 'required|string',
                'nutrition_info' => 'nullable|string',
                'usability' => 'required|string',
                'quantity' => 'nullable|string|max:100',
                'size' => 'nullable|string|max:100',
                'shape' => 'nullable|string|max:100',
                'color' => 'nullable|string|max:100',
                'package_info' => 'nullable|string',
                'manufacture_date' => 'nullable|date',
                'best_before' => 'nullable|date|after:manufacture_date',
                'retail_price' => 'nullable|numeric|min:0',
                'wholesale_price' => 'nullable|numeric|min:0',
                'retail_contact' => 'nullable|string|max:255',
                'wholesale_contact' => 'nullable|string|max:255',
                'is_made_in_nepal' => 'required|in:1,0,true,false',
                'has_nepali_address' => 'required|in:1,0,true,false',
                'images' => 'required|array|min:1|max:8',
                'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ], [
                'images.required' => 'Please upload at least one product image.',
                'images.min' => 'Please upload at least one product image.',
                'materials_use.required' => 'Materials used field is required.',
                'usability.required' => 'Usability field is required.',
            ]);

            // Convert string '1'/'0' to boolean
            $validated['is_made_in_nepal'] = filter_var($validated['is_made_in_nepal'], FILTER_VALIDATE_BOOLEAN);
            $validated['has_nepali_address'] = filter_var($validated['has_nepali_address'], FILTER_VALIDATE_BOOLEAN);
            
            // Validate Made in Nepal and Nepali address
            if (!$validated['is_made_in_nepal']) {
                return response()->json(['error' => 'Product must be made in Nepal'], 422);
            }

            if (!$validated['has_nepali_address']) {
                return response()->json(['error' => 'Product must have a Nepali address'], 422);
            }
            // Generate unique slug
            $slugBase = Str::slug($validated['title']);
            $slug = $this->uniqueSlug($slugBase);
            
            // Create the product
            $product = NepaliProduct::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'slug' => $slug,
                'company_name' => $validated['company_name'],
                'company_history' => $validated['company_history'] ?? null,
                'company_address' => $validated['company_address'],
                'company_latitude' => $validated['company_latitude'] ?? null,
                'company_longitude' => $validated['company_longitude'] ?? null,
                'category_id' => $validated['category_id'],
                'subcategory_id' => $validated['subcategory_id'] ?? null,
                'production_items' => $validated['production_items'],
                'materials_use' => $validated['materials_use'],
                'nutrition_info' => $validated['nutrition_info'] ?? null,
                'usability' => $validated['usability'],
                'quantity' => $validated['quantity'] ?? null,
                'size' => $validated['size'] ?? null,
                'shape' => $validated['shape'] ?? null,
                'color' => $validated['color'] ?? null,
                'package_info' => $validated['package_info'] ?? null,
                'manufacture_date' => $validated['manufacture_date'] ?? null,
                'best_before' => $validated['best_before'] ?? null,
                'retail_price' => $validated['retail_price'] ?? null,
                'wholesale_price' => $validated['wholesale_price'] ?? null,
                'retail_contact' => $validated['retail_contact'] ?? null,
                'wholesale_contact' => $validated['wholesale_contact'] ?? null,
                'is_made_in_nepal' => true,
                'has_nepali_address' => true,
                'status' => 'pending', // Requires admin approval
            ]);

            // Handle image uploads
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                $storagePath = storage_path('app/public/nepali-products');
                
                // Ensure directory exists
                if (!File::exists($storagePath)) {
                    File::makeDirectory($storagePath, 0755, true);
                }

                foreach ($images as $index => $image) {
                    if ($image && $image->isValid()) {
                        // Resize image to 400x400px
                        $resizedImage = $this->resizeImage($image, 400, 400);
                        
                        // Generate unique filename
                        $filename = time() . '_' . $index . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                        $path = 'nepali-products/' . $filename;
                        
                        // Store resized image
                        Storage::disk('public')->put($path, $resizedImage);
                        
                        // Create image record
                        NepaliProductImage::create([
                            'nepali_product_id' => $product->id,
                            'image_path' => $path,
                            'image_order' => $index,
                        ]);
                    }
                }
            }

            // Load relationships
            $product->load(['user', 'category', 'subcategory', 'images']);

            return response()->json($product, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors in a readable format
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Please check the form for errors',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('NepaliProduct store error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to create product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a product
     */
    public function update(Request $request, $id)
    {
        $product = NepaliProduct::findOrFail($id);

        // Check ownership or admin
        if ($product->user_id !== $request->user()->id && $request->user()->role !== 'admin' && $request->user()->role !== 'super_admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:150',
            'company_name' => 'sometimes|string|max:255',
            'company_history' => 'nullable|string|max:2000',
            'company_address' => 'sometimes|string',
            'company_latitude' => 'nullable|numeric|between:-90,90',
            'company_longitude' => 'nullable|numeric|between:-180,180',
            'category_id' => 'sometimes|exists:categories,id',
            'subcategory_id' => 'nullable|exists:categories,id',
            'production_items' => 'sometimes|string|max:255',
            'materials_use' => 'sometimes|string',
            'nutrition_info' => 'nullable|string',
            'usability' => 'sometimes|string',
            'quantity' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:100',
            'shape' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:100',
            'package_info' => 'nullable|string',
            'manufacture_date' => 'nullable|date',
            'best_before' => 'nullable|date|after:manufacture_date',
            'retail_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'retail_contact' => 'nullable|string|max:255',
            'wholesale_contact' => 'nullable|string|max:255',
            'images' => 'sometimes|array|max:8',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        try {
            // Update slug if title changed
            if (isset($validated['title']) && $validated['title'] !== $product->title) {
                $slugBase = Str::slug($validated['title']);
                $validated['slug'] = $this->uniqueSlug($slugBase, $product->id);
            }
            
            // Update product fields
            $product->update($validated);

            // Handle new image uploads if provided
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                $storagePath = storage_path('app/public/nepali-products');
                
                if (!File::exists($storagePath)) {
                    File::makeDirectory($storagePath, 0755, true);
                }

                // Get current image count
                $currentCount = $product->images()->count();
                $maxImages = 8;
                $availableSlots = $maxImages - $currentCount;

                foreach ($images as $index => $image) {
                    if ($image && $image->isValid() && $index < $availableSlots) {
                        $resizedImage = $this->resizeImage($image, 400, 400);
                        $filename = time() . '_' . ($currentCount + $index) . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                        $path = 'nepali-products/' . $filename;
                        
                        Storage::disk('public')->put($path, $resizedImage);
                        
                        NepaliProductImage::create([
                            'nepali_product_id' => $product->id,
                            'image_path' => $path,
                            'image_order' => $currentCount + $index,
                        ]);
                    }
                }
            }

            $product->load(['user', 'category', 'subcategory', 'images']);

            return response()->json($product);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, $id)
    {
        $product = NepaliProduct::findOrFail($id);

        // Check ownership or admin
        if ($product->user_id !== $request->user()->id && $request->user()->role !== 'admin' && $request->user()->role !== 'super_admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            // Delete images from storage
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image->image_path);
            }

            // Delete product (cascade will delete images and ratings)
            $product->delete();

            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Rate a product
     */
    public function rate(Request $request, $id)
    {
        $product = NepaliProduct::findOrFail($id);

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            // Check if user already rated
            $existingRating = NepaliProductRating::where('nepali_product_id', $product->id)
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existingRating) {
                // Update existing rating
                $existingRating->update($validated);
            } else {
                // Create new rating
                NepaliProductRating::create([
                    'nepali_product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'] ?? null,
                ]);
            }

            // Update product rating average
            $product->updateRatingAverage();

            return response()->json(['message' => 'Rating saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save rating: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Resize image to specified dimensions
     */
    private function resizeImage($image, $width, $height)
    {
        // Check if GD extension is available
        if (!extension_loaded('gd')) {
            // If GD is not available, just return the original file content
            return file_get_contents($image->getRealPath());
        }

        // Get image info
        $imageInfo = getimagesize($image->getRealPath());
        if (!$imageInfo) {
            return file_get_contents($image->getRealPath());
        }

        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];

        // Create image resource from file
        switch ($mimeType) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($image->getRealPath());
                break;
            case 'image/png':
                $source = imagecreatefrompng($image->getRealPath());
                break;
            case 'image/gif':
                $source = imagecreatefromgif($image->getRealPath());
                break;
            case 'image/webp':
                $source = imagecreatefromwebp($image->getRealPath());
                break;
            default:
                return file_get_contents($image->getRealPath());
        }

        if (!$source) {
            return file_get_contents($image->getRealPath());
        }

        // Calculate aspect ratio
        $aspectRatio = $originalWidth / $originalHeight;
        
        // Calculate new dimensions maintaining aspect ratio
        if ($aspectRatio > 1) {
            // Landscape
            $newWidth = $width;
            $newHeight = $width / $aspectRatio;
        } else {
            // Portrait or square
            $newHeight = $height;
            $newWidth = $height * $aspectRatio;
        }

        // Create new image
        $destination = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG and GIF
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($destination, false);
            imagesavealpha($destination, true);
            $transparent = imagecolorallocatealpha($destination, 255, 255, 255, 127);
            imagefilledrectangle($destination, 0, 0, $newWidth, $newHeight, $transparent);
        }

        // Resize
        imagecopyresampled(
            $destination,
            $source,
            0, 0, 0, 0,
            $newWidth,
            $newHeight,
            $originalWidth,
            $originalHeight
        );

        // Output to buffer
        ob_start();
        switch ($mimeType) {
            case 'image/jpeg':
                imagejpeg($destination, null, 85);
                break;
            case 'image/png':
                imagepng($destination, null, 8);
                break;
            case 'image/gif':
                imagegif($destination);
                break;
            case 'image/webp':
                imagewebp($destination, null, 85);
                break;
        }
        $imageData = ob_get_contents();
        ob_end_clean();

        // Clean up
        imagedestroy($source);
        imagedestroy($destination);

        return $imageData;
    }

    /**
     * Generate unique slug
     */
    private function uniqueSlug(string $baseSlug, ?int $excludeId = null): string
    {
        $slug = $baseSlug;
        $i = 1;
        $query = NepaliProduct::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        while ($query->exists()) {
            $slug = $baseSlug . '-' . $i;
            $query = NepaliProduct::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            $i++;
        }
        return $slug;
    }
}
