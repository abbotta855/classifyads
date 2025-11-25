<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportManagement;
use Illuminate\Http\Request;

class SupportManagementController extends Controller
{
    public function index()
    {
        $supports = SupportManagement::with(['issueReporter', 'assignTo'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($support) {
                return [
                    'id' => $support->id,
                    'issue_error' => $support->issue_error,
                    'issue_reporter_id' => $support->issue_reporter_id,
                    'issue_reporter_name' => $support->issueReporter->name ?? 'N/A',
                    'issue_reporter_email' => $support->issueReporter->email ?? 'N/A',
                    'date' => $support->date,
                    'assign_to_id' => $support->assign_to_id,
                    'assign_to_name' => $support->assignTo->name ?? 'N/A',
                    'assign_date' => $support->assign_date,
                    'error_status' => $support->error_status,
                    'note_solution' => $support->note_solution,
                    'created_at' => $support->created_at,
                    'updated_at' => $support->updated_at,
                ];
            });

        // Get unsolved issues (pending or in_progress)
        $unsolvedIssues = SupportManagement::with(['issueReporter', 'assignTo'])
            ->whereIn('error_status', ['pending', 'in_progress'])
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($support) {
                return [
                    'id' => $support->id,
                    'issue_error' => $support->issue_error,
                    'issue_reporter_name' => $support->issueReporter->name ?? 'N/A',
                    'date' => $support->date,
                ];
            });

        return response()->json([
            'supports' => $supports,
            'unsolved_issues' => $unsolvedIssues,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'issue_error' => 'required|string|max:255',
            'issue_reporter_id' => 'nullable|exists:users,id',
            'date' => 'required|date',
            'assign_to_id' => 'nullable|exists:users,id',
            'assign_date' => 'nullable|date',
            'error_status' => 'sometimes|in:pending,in_progress,resolved,closed',
            'note_solution' => 'nullable|string',
        ]);

        $validated['error_status'] = $validated['error_status'] ?? 'pending';

        $support = SupportManagement::create($validated);

        return response()->json($support->load(['issueReporter', 'assignTo']), 201);
    }

    public function show(string $id)
    {
        $support = SupportManagement::with(['issueReporter', 'assignTo'])->findOrFail($id);
        return response()->json($support);
    }

    public function update(Request $request, string $id)
    {
        $support = SupportManagement::findOrFail($id);

        $validated = $request->validate([
            'issue_error' => 'sometimes|string|max:255',
            'issue_reporter_id' => 'sometimes|nullable|exists:users,id',
            'date' => 'sometimes|date',
            'assign_to_id' => 'sometimes|nullable|exists:users,id',
            'assign_date' => 'sometimes|nullable|date',
            'error_status' => 'sometimes|in:pending,in_progress,resolved,closed',
            'note_solution' => 'sometimes|nullable|string',
        ]);

        $support->update($validated);

        return response()->json($support->load(['issueReporter', 'assignTo']));
    }

    public function destroy(string $id)
    {
        $support = SupportManagement::findOrFail($id);
        $support->delete();

        return response()->json(['message' => 'Support issue deleted successfully']);
    }
}

