<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailSubscriber;
use App\Models\User;
use Illuminate\Http\Request;

class EmailSubscriberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscribers = EmailSubscriber::with('user')
            ->orderBy('start_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($subscriber) {
                return [
                    'id' => $subscriber->id,
                    'user_id' => $subscriber->user_id,
                    'username' => $subscriber->username,
                    'email' => $subscriber->email,
                    'subscribe_volume' => $subscriber->subscribe_volume,
                    'amount' => $subscriber->amount,
                    'start_date' => optional($subscriber->start_date)->toDateString(),
                    'end_date' => optional($subscriber->end_date)->toDateString(),
                    'subscription_type' => $subscriber->subscription_type,
                    'user_name' => $subscriber->user->name ?? null,
                ];
            });

        return response()->json($subscribers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'username' => 'required_without:user_id|string|max:255',
            'email' => 'nullable|email|max:255',
            'subscribe_volume' => 'required|integer|min:0',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'subscription_type' => 'nullable|string|max:255',
        ]);

        if (!empty($validated['user_id'])) {
            $user = User::find($validated['user_id']);
            if ($user) {
                $validated['username'] = $user->name;
                $validated['email'] = $validated['email'] ?? $user->email;
            }
        }

        $subscriber = EmailSubscriber::create($validated);

        return response()->json($subscriber->fresh('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $subscriber = EmailSubscriber::with('user')->findOrFail($id);
        return response()->json($subscriber);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $subscriber = EmailSubscriber::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'username' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'subscribe_volume' => 'sometimes|integer|min:0',
            'amount' => 'sometimes|numeric|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'subscription_type' => 'nullable|string|max:255',
        ]);

        if (!empty($validated['user_id'])) {
            $user = User::find($validated['user_id']);
            if ($user) {
                $validated['username'] = $validated['username'] ?? $user->name;
                $validated['email'] = $validated['email'] ?? $user->email;
            }
        }

        $subscriber->update($validated);

        return response()->json($subscriber->fresh('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subscriber = EmailSubscriber::findOrFail($id);
        $subscriber->delete();

        return response()->json(['message' => 'Email subscriber deleted successfully']);
    }
}

