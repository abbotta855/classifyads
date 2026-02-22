<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EmailSubscriptionController extends Controller
{
    /**
     * Subscribe email
     */
    public function subscribe(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');

        // Check if email already exists
        $exists = DB::table('email_subscribers')
            ->where('email', $email)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Email is already subscribed',
                'already_subscribed' => true,
            ], 200);
        }

        // Insert email
        DB::table('email_subscribers')->insert([
            'email' => $email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Successfully subscribed to our newsletter',
            'already_subscribed' => false,
        ], 201);
    }
}

