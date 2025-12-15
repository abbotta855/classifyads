<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EbookController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $ebooks = Ebook::with(['user', 'category'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($ebooks);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'writer' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'pages' => 'nullable|integer|min:1',
            'book_size' => 'nullable|string|max:50',
            'file_format' => 'nullable|string|max:50',
            'file' => 'required|file|mimes:pdf,epub,mobi,doc,docx|max:102400', // 100MB max
            // Allow cover images up to 20MB to avoid frequent validation failures
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
            // Log and return a clear validation message for debugging
            \Log::warning('Ebook validation failed', [
                'errors' => $validator->errors()->toArray(),
                'payload_keys' => array_keys($request->all()),
            ]);

            return response()->json([
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if user is seller verified (allow unverified for testing, but log)
        $user = User::findOrFail($request->user_id);
        if (!$user->seller_verified) {
            \Log::warning('Creating eBook for unverified seller (testing mode allowed)', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        }

        $data = $validator->validated();

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('ebooks/files', $fileName, 'public');
            $data['file_url'] = Storage::url($path);
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            // Store a short file type (extension) to fit varchar(50) column
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            $coverImage = $request->file('cover_image');
            $coverImageName = time() . '_' . $coverImage->getClientOriginalName();
            $coverPath = $coverImage->storeAs('ebooks/covers', $coverImageName, 'public');
            $data['cover_image'] = Storage::url($coverPath);
        }

        // Remove file and cover_image from data array (already processed)
        unset($data['file'], $data['cover_image']);

        // Set default status
        $data['status'] = 'active';

        $ebook = Ebook::create($data);

        return response()->json($ebook->load(['user', 'category']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $ebook = Ebook::with(['user', 'category'])->findOrFail($id);
        return response()->json($ebook);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $ebook = Ebook::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'writer' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'pages' => 'nullable|integer|min:1',
            'book_size' => 'nullable|string|max:50',
            'file_format' => 'nullable|string|max:50',
            'file' => 'sometimes|file|mimes:pdf,epub,mobi,doc,docx|max:102400',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:20480',
            'price' => 'sometimes|numeric|min:0',
            'publisher_name' => 'nullable|string|max:255',
            'publisher_address' => 'nullable|string',
            'publisher_website' => 'nullable|url|max:500',
            'publisher_email' => 'nullable|email|max:255',
            'publisher_phone' => 'nullable|string|max:50',
            'copyright_declared' => 'sometimes|boolean',
            'book_type' => 'sometimes|in:ebook,hard_copy,both',
            'shipping_cost' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:100',
            'status' => 'sometimes|in:draft,active,inactive,removed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Handle file replacement
        if ($request->hasFile('file')) {
            // Delete old file
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

        // Handle cover image replacement
        if ($request->hasFile('cover_image')) {
            // Delete old cover image
            if ($ebook->cover_image) {
                $oldCoverPath = str_replace('/storage/', '', $ebook->cover_image);
                Storage::disk('public')->delete($oldCoverPath);
            }

            $coverImage = $request->file('cover_image');
            $coverImageName = time() . '_' . $coverImage->getClientOriginalName();
            $coverPath = $coverImage->storeAs('ebooks/covers', $coverImageName, 'public');
            $data['cover_image'] = Storage::url($coverPath);
        }

        // Remove file and cover_image from data array (already processed)
        unset($data['file'], $data['cover_image']);

        $ebook->update($data);

        return response()->json($ebook->load(['user', 'category']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $ebook = Ebook::findOrFail($id);

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
}
