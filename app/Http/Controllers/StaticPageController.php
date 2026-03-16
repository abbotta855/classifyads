<?php

namespace App\Http\Controllers;

use App\Models\StaticPage;
use Illuminate\Http\Request;

class StaticPageController extends Controller
{
    /**
     * Display a static page by slug
     */
    public function show(string $slug)
    {
        $page = StaticPage::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json($page);
    }
}
