<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index()
    {
        $posts = BlogPost::with(['category', 'tags', 'user'])
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json($posts);
    }

    public function show($slug)
    {
        $post = BlogPost::with(['category', 'tags', 'user'])
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json($post);
    }
}

