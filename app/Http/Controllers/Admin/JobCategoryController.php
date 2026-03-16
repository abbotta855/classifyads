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
        $categories = JobCategory::withCount('jobApplicants')
            ->orderBy('job_category_name')
            ->get();

        // Add calculated count to each category
        $categories->transform(function ($category) {
            $category->posted_job = $category->job_applicants_count;
            return $category;
        });

        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_category_name' => 'required|string|max:255',
            'job_status' => 'required|in:draft,active,closed',
        ]);

        // Set default posted_job to 0 (will be calculated automatically via relationship)
        $validated['posted_job'] = 0;

        $category = JobCategory::create($validated);

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
            'job_category_name' => 'sometimes|string|max:255',
            'job_status' => 'sometimes|in:draft,active,closed',
        ]);

        // Don't update posted_job - it's calculated automatically
        $category->update($validated);

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
