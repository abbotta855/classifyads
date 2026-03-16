<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobApplicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JobApplicantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $applicants = JobApplicant::with('jobCategory')->orderBy('created_at', 'desc')->get();
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
            'job_category_id' => 'required|exists:job_categories,id',
            'cv_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'cover_letter_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'reference_letter_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'interview_date' => 'nullable|date',
            'job_progress' => 'required|in:applied,screening,interview,offer,hired,rejected',
        ]);

        $data = [
            'job_title' => $validated['job_title'],
            'posted_date' => $validated['posted_date'] ?? null,
            'expected_salary' => $validated['expected_salary'] ?? null,
            'applicant_name' => $validated['applicant_name'],
            'job_category_id' => $validated['job_category_id'],
            'interview_date' => $validated['interview_date'] ?? null,
            'job_progress' => $validated['job_progress'],
        ];

        // Handle CV file upload
        if ($request->hasFile('cv_file')) {
            $cvPath = $request->file('cv_file')->store('job_applicants/cv', 'public');
            $data['cv_file_url'] = Storage::url($cvPath);
        }

        // Handle cover letter file upload
        if ($request->hasFile('cover_letter_file')) {
            $coverLetterPath = $request->file('cover_letter_file')->store('job_applicants/cover_letters', 'public');
            $data['cover_letter_file_url'] = Storage::url($coverLetterPath);
        }

        // Handle reference letter file upload
        if ($request->hasFile('reference_letter_file')) {
            $referenceLetterPath = $request->file('reference_letter_file')->store('job_applicants/reference_letters', 'public');
            $data['reference_letter_file_url'] = Storage::url($referenceLetterPath);
        }

        $applicant = JobApplicant::create($data);

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
            'job_category_id' => 'sometimes|exists:job_categories,id',
            'cv_file' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'cover_letter_file' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'reference_letter_file' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'interview_date' => 'sometimes|nullable|date',
            'job_progress' => 'sometimes|in:applied,screening,interview,offer,hired,rejected',
        ]);

        $data = [
            'job_title' => $validated['job_title'] ?? $applicant->job_title,
            'posted_date' => $validated['posted_date'] ?? $applicant->posted_date,
            'expected_salary' => $validated['expected_salary'] ?? $applicant->expected_salary,
            'applicant_name' => $validated['applicant_name'] ?? $applicant->applicant_name,
            'job_category_id' => $validated['job_category_id'] ?? $applicant->job_category_id,
            'interview_date' => $validated['interview_date'] ?? $applicant->interview_date,
            'job_progress' => $validated['job_progress'] ?? $applicant->job_progress,
        ];

        // Handle CV file upload (replace existing if new file is uploaded)
        if ($request->hasFile('cv_file')) {
            // Delete old file if exists
            if ($applicant->cv_file_url) {
                $oldPath = str_replace('/storage/', '', $applicant->cv_file_url);
                Storage::disk('public')->delete($oldPath);
            }
            $cvPath = $request->file('cv_file')->store('job_applicants/cv', 'public');
            $data['cv_file_url'] = Storage::url($cvPath);
        }

        // Handle cover letter file upload
        if ($request->hasFile('cover_letter_file')) {
            if ($applicant->cover_letter_file_url) {
                $oldPath = str_replace('/storage/', '', $applicant->cover_letter_file_url);
                Storage::disk('public')->delete($oldPath);
            }
            $coverLetterPath = $request->file('cover_letter_file')->store('job_applicants/cover_letters', 'public');
            $data['cover_letter_file_url'] = Storage::url($coverLetterPath);
        }

        // Handle reference letter file upload
        if ($request->hasFile('reference_letter_file')) {
            if ($applicant->reference_letter_file_url) {
                $oldPath = str_replace('/storage/', '', $applicant->reference_letter_file_url);
                Storage::disk('public')->delete($oldPath);
            }
            $referenceLetterPath = $request->file('reference_letter_file')->store('job_applicants/reference_letters', 'public');
            $data['reference_letter_file_url'] = Storage::url($referenceLetterPath);
        }

        $applicant->update($data);

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
