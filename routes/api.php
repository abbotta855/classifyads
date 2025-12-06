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
use App\Http\Controllers\Admin\JobCategoryController;
use App\Http\Controllers\Admin\JobApplicantController;
use App\Http\Controllers\Admin\LiveChatController;
use App\Http\Controllers\Admin\LiveChatMessageController;
use App\Http\Controllers\Admin\OfferController;
use App\Http\Controllers\Admin\RatingController;
use App\Http\Controllers\Admin\SalesReportController;
use App\Http\Controllers\Admin\StockManagementController;
use App\Http\Controllers\Admin\EmailSubscriberController;
use App\Http\Controllers\Admin\SupportManagementController;
use App\Http\Controllers\Admin\TransactionManagementController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// OTP routes (public)
Route::post('/otp/generate', [App\Http\Controllers\OtpController::class, 'generate']);
Route::post('/otp/verify', [App\Http\Controllers\OtpController::class, 'verify']);
Route::post('/otp/resend', [App\Http\Controllers\OtpController::class, 'resend']);

// Test email route (for debugging - remove in production)
Route::get('/test-email', function() {
    try {
        $otpCode = '123456';
        $userName = 'Test User';
        \Illuminate\Support\Facades\Mail::to('daltonrosemond.snow@gmail.com')->send(new App\Mail\OtpMail($otpCode, $userName));
        return response()->json(['message' => 'Test email sent successfully! Check Mailtrap inbox.']);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Public category routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

// Public location routes
Route::get('/locations', [App\Http\Controllers\LocationController::class, 'index']);

// Public ads routes (for homepage)
Route::get('/ads', [App\Http\Controllers\AdController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
  Route::post('/logout', [AuthController::class, 'logout']);
  Route::get('/user', [AuthController::class, 'user']);
  Route::post('/change-password', [AuthController::class, 'changePassword']);

  // User profile routes
  Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show']);
  Route::match(['put', 'post'], '/profile', [App\Http\Controllers\ProfileController::class, 'update']);
  Route::post('/profile/change-password', [App\Http\Controllers\ProfileController::class, 'changePassword']);

  // Dashboard statistics
  Route::get('/dashboard/stats', [App\Http\Controllers\DashboardStatsController::class, 'index']);

  // User ad management routes
  Route::prefix('user')->group(function () {
    Route::apiResource('ads', App\Http\Controllers\UserAdController::class);
    Route::post('ads/{id}/mark-sold', [App\Http\Controllers\UserAdController::class, 'markSold']);
  });

  // Increment ad view count (public but authenticated)
  Route::post('/ads/{id}/view', [App\Http\Controllers\UserAdController::class, 'incrementView']);

  // Favourites routes
  Route::get('/favourites', [App\Http\Controllers\FavouriteController::class, 'index']);
  Route::post('/favourites', [App\Http\Controllers\FavouriteController::class, 'store']);
  Route::delete('/favourites/{id}', [App\Http\Controllers\FavouriteController::class, 'destroy']);
  Route::delete('/favourites/ad/{adId}', [App\Http\Controllers\FavouriteController::class, 'removeByAd']);
  Route::get('/favourites/check/{adId}', [App\Http\Controllers\FavouriteController::class, 'check']);

  // Watchlist routes
  Route::get('/watchlists', [App\Http\Controllers\WatchlistController::class, 'index']);
  Route::post('/watchlists', [App\Http\Controllers\WatchlistController::class, 'store']);
  Route::delete('/watchlists/{id}', [App\Http\Controllers\WatchlistController::class, 'destroy']);
  Route::delete('/watchlists/ad/{adId}', [App\Http\Controllers\WatchlistController::class, 'removeByAd']);
  Route::get('/watchlists/check/{adId}', [App\Http\Controllers\WatchlistController::class, 'check']);

  // Recently Viewed routes
  Route::get('/recently-viewed', [App\Http\Controllers\RecentlyViewedController::class, 'index']);
  Route::post('/recently-viewed/track', [App\Http\Controllers\RecentlyViewedController::class, 'track']);
  Route::delete('/recently-viewed/{id}', [App\Http\Controllers\RecentlyViewedController::class, 'destroy']);
  Route::delete('/recently-viewed/clear', [App\Http\Controllers\RecentlyViewedController::class, 'clear']);

  // Saved Searches routes
  Route::get('/saved-searches', [App\Http\Controllers\SavedSearchController::class, 'index']);
  Route::post('/saved-searches', [App\Http\Controllers\SavedSearchController::class, 'store']);
  Route::put('/saved-searches/{id}', [App\Http\Controllers\SavedSearchController::class, 'update']);
  Route::delete('/saved-searches/{id}', [App\Http\Controllers\SavedSearchController::class, 'destroy']);
  Route::post('/saved-searches/{id}/toggle', [App\Http\Controllers\SavedSearchController::class, 'toggleActive']);

  // Notifications routes
  Route::get('/notifications', [App\Http\Controllers\UserNotificationController::class, 'index']);
  Route::get('/notifications/unread-count', [App\Http\Controllers\UserNotificationController::class, 'unreadCount']);
  Route::post('/notifications/{id}/read', [App\Http\Controllers\UserNotificationController::class, 'markAsRead']);
  Route::post('/notifications/read-all', [App\Http\Controllers\UserNotificationController::class, 'markAllAsRead']);
  Route::delete('/notifications/{id}', [App\Http\Controllers\UserNotificationController::class, 'destroy']);

  // Inbox/Messaging routes
  Route::get('/inbox', [App\Http\Controllers\UserLiveChatController::class, 'index']);
  Route::get('/inbox/{id}', [App\Http\Controllers\UserLiveChatController::class, 'show']);
  Route::post('/inbox', [App\Http\Controllers\UserLiveChatController::class, 'store']);
  Route::post('/inbox/{id}/message', [App\Http\Controllers\UserLiveChatController::class, 'sendMessage']);

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
    Route::post('users/{user}/comment', [UserController::class, 'addComment']);
    
    // Categories management
    Route::apiResource('categories', AdminCategoryController::class);

    // Job management
    Route::apiResource('job-categories', JobCategoryController::class);
    Route::apiResource('job-applicants', JobApplicantController::class);

    // Live chat management
    Route::apiResource('live-chats', LiveChatController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::get('live-chats/{live_chat}/messages', [LiveChatMessageController::class, 'index']);
    Route::post('live-chats/{live_chat}/messages', [LiveChatMessageController::class, 'store']);
    Route::post('live-chats/{live_chat}/mark-read', [LiveChatMessageController::class, 'markAsRead']);

    // Offers/Discounts management
    Route::apiResource('offers', OfferController::class);
    Route::post('offers/{offer}/approve', [OfferController::class, 'approve']);

    // Ratings/Reviews management
    Route::apiResource('ratings', RatingController::class);
    Route::apiResource('rating-criteria', App\Http\Controllers\Admin\RatingCriteriaController::class);

    // Sales Report
    Route::apiResource('sales-report', SalesReportController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Stock Management
    Route::apiResource('stock-management', StockManagementController::class);
    Route::post('stock-management/{stock}/mark-alert-read', [StockManagementController::class, 'markAlertAsRead']);

    // Email Subscribers
    Route::apiResource('email-subscribers', EmailSubscriberController::class);

    // Support Management
    Route::apiResource('support-management', SupportManagementController::class);

    // Transaction Management
    Route::apiResource('transaction-management', TransactionManagementController::class);
  });
});
