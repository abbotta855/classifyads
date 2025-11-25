<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SalesReport;
use Illuminate\Http\Request;

class SalesReportController extends Controller
{
    public function index()
    {
        // Get all sales reports with user relationship
        $salesReports = SalesReport::with('user')
            ->orderBy('total_earning', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'user_id' => $report->user_id,
                    'name' => $report->user->name ?? 'N/A',
                    'email' => $report->user->email ?? 'N/A',
                    'listed_items' => $report->listed_items,
                    'sold_items' => $report->sold_items,
                    'earning' => $report->earning,
                    'total_earning' => $report->total_earning,
                ];
            });

        // Calculate vendor-wise total earning (sum of all earnings)
        $vendorWiseTotalEarning = SalesReport::sum('total_earning') ?? 0;

        // Calculate user-wise total earning (same as vendor-wise from different perspective)
        $userWiseTotalEarning = SalesReport::sum('total_earning') ?? 0;

        return response()->json([
            'vendor_wise_total_earning' => round($vendorWiseTotalEarning, 2),
            'user_wise_total_earning' => round($userWiseTotalEarning, 2),
            'sales_report' => $salesReports,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:sales_report,user_id',
            'listed_items' => 'required|integer|min:0',
            'sold_items' => 'required|integer|min:0',
            'earning' => 'required|numeric|min:0',
            'total_earning' => 'required|numeric|min:0',
        ]);

        $salesReport = SalesReport::create($validated);

        return response()->json($salesReport->load('user'), 201);
    }

    public function show(string $id)
    {
        $salesReport = SalesReport::with('user')->findOrFail($id);
        return response()->json($salesReport);
    }

    public function update(Request $request, string $id)
    {
        $salesReport = SalesReport::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'sometimes|exists:users,id|unique:sales_report,user_id,' . $id,
            'listed_items' => 'sometimes|integer|min:0',
            'sold_items' => 'sometimes|integer|min:0',
            'earning' => 'sometimes|numeric|min:0',
            'total_earning' => 'sometimes|numeric|min:0',
        ]);

        $salesReport->update($validated);

        return response()->json($salesReport->load('user'));
    }

    public function destroy(string $id)
    {
        $salesReport = SalesReport::findOrFail($id);
        $salesReport->delete();

        return response()->json(['message' => 'Sales report deleted successfully']);
    }
}

