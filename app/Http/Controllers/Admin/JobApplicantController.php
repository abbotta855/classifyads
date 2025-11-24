<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobApplicant;
use Illuminate\Http\Request;

class JobApplicantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $applicants = JobApplicant::orderBy('created_at', 'desc')->get();
        return response()->json($applicants);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_title' => 'required|string|max:255',
            'posted_date' => 'nullable|date',
            'expected_salary' => 'nullable|numeric|min:0',
            'applicant_name' => 'required|string|max:255',
            'interview_date' => 'nullable|date',
            'job_progress' => 'required|in:applied,screening,interview,offer,hired,rejected',
        ]);

        $applicant = JobApplicant::create($validated);

        return response()->json($applicant, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $applicant = JobApplicant::findOrFail($id);
        return response()->json($applicant);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $applicant = JobApplicant::findOrFail($id);

        $validated = $request->validate([
            'job_title' => 'sometimes|string|max:255',
            'posted_date' => 'sometimes|nullable|date',
            'expected_salary' => 'sometimes|nullable|numeric|min:0',
            'applicant_name' => 'sometimes|string|max:255',
            'interview_date' => 'sometimes|nullable|date',
            'job_progress' => 'sometimes|in:applied,screening,interview,offer,hired,rejected',
        ]);

        $applicant->update($validated);

        return response()->json($applicant);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $applicant = JobApplicant::findOrFail($id);
        $applicant->delete();

        return response()->json(['message' => 'Job applicant deleted successfully']);
    }
}
