<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaticPage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StaticPageController extends Controller
{
    /**
     * List all static pages
     */
    public function index()
    {
        $pages = StaticPage::orderBy('slug')->get();
        return response()->json($pages);
    }

    /**
     * Get a specific static page
     */
    public function show(string $id)
    {
        $page = StaticPage::findOrFail($id);
        return response()->json($page);
    }

    /**
     * Create or update a static page
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|max:255|unique:static_pages,slug',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $page = StaticPage::create([
            'slug' => $request->slug,
            'title' => $request->title,
            'content' => $request->content,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($page, 201);
    }

    /**
     * Update a static page
     */
    public function update(Request $request, string $id)
    {
        $page = StaticPage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'slug' => 'sometimes|required|string|max:255|unique:static_pages,slug,' . $id,
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $page->update($request->only(['slug', 'title', 'content', 'is_active']));

        return response()->json($page);
    }

    /**
     * Delete a static page
     */
    public function destroy(string $id)
    {
        $page = StaticPage::findOrFail($id);
        $page->delete();

        return response()->json(['message' => 'Static page deleted successfully']);
    }
}
