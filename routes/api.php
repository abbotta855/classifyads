<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Admin\AdController;
use App\Http\Controllers\Admin\AuctionController;
use App\Http\Controllers\Admin\DeliveryController;
use App\Http\Controllers\Admin\PurchaseVerificationController;
use App\Http\Controllers\Admin\BiddingHistoryController;
use App\Http\Controllers\Admin\BidWinnerController;
use App\Http\Controllers\Admin\BlockedUserController;
use App\Http\Controllers\Admin\BiddingTrackingController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public category routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

// Public location routes
Route::get('/locations', [App\Http\Controllers\LocationController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
  Route::post('/logout', [AuthController::class, 'logout']);
  Route::get('/user', [AuthController::class, 'user']);

  // Admin routes
  Route::prefix('admin')->group(function () {
    // Ads management
    Route::apiResource('ads', AdController::class);
    
    // Auctions management
    Route::apiResource('auctions', AuctionController::class);
    
    // Deliveries management
    Route::apiResource('deliveries', DeliveryController::class);
    
    // Purchase Verifications management
    Route::apiResource('purchase-verifications', PurchaseVerificationController::class);
    
    // Bidding History management
    Route::apiResource('bidding-history', BiddingHistoryController::class);
    
    // Bid Winners management
    Route::apiResource('bid-winners', BidWinnerController::class);
    
    // Blocked Users management
    Route::apiResource('blocked-users', BlockedUserController::class);
    
    // Bidding Tracking management
    Route::apiResource('bidding-tracking', BiddingTrackingController::class);
    
    // Locations management
    Route::apiResource('locations', LocationController::class);
    
    // Users management
    Route::apiResource('users', UserController::class);
    
    // Categories management
    Route::apiResource('categories', AdminCategoryController::class);
  });
});
