<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use Illuminate\Http\Request;

class JobCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = JobCategory::with('category')
            ->orderBy('category_id')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'posted_job' => 'nullable|integer|min:0',
            'job_status' => 'required|in:draft,active,closed',
        ]);

        if (!isset($validated['posted_job'])) {
            $validated['posted_job'] = 0;
        }

        $category = JobCategory::create($validated);
        $category->load('category');

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = JobCategory::findOrFail($id);
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $category = JobCategory::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'posted_job' => 'sometimes|integer|min:0',
            'job_status' => 'sometimes|in:draft,active,closed',
        ]);

        $category->update($validated);
        $category->load('category');

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = JobCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Job category deleted successfully']);
    }
}
