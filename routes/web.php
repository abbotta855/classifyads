<?php

use Illuminate\Support\Facades\Route;

// SPA routes - all routes should serve the welcome blade template
// React Router will handle client-side routing
Route::view('/{path?}', 'welcome')->where('path', '.*');
