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
use App\Http\Controllers\Admin\EbookController;
use App\Http\Controllers\Admin\StockManagementController;
use App\Http\Controllers\Admin\EmailSubscriberController;
use App\Http\Controllers\Admin\SupportManagementController;
use App\Http\Controllers\Admin\TransactionManagementController;
use App\Http\Controllers\SellerVerificationController;
use App\Http\Controllers\LiveChatController as UserLiveChatController;
use App\Http\Controllers\SupportAvailabilityController;
use App\Http\Controllers\SupportOfflineMessageController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\Admin\BlogAdminController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\ForumAdminController;
use App\Http\Controllers\AnalyticsController;
use Illuminate\Support\Facades\Route;

// Temporary debug route for upload limits (remove in production)
Route::get('/debug/php-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_file_uploads' => ini_get('max_file_uploads'),
    ]);
});

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
Route::get('/ads/{id}', [App\Http\Controllers\AdController::class, 'show']);
Route::post('/ads/{id}/click', [App\Http\Controllers\AdController::class, 'trackClick']);

// Public auction routes
Route::get('/auctions', [App\Http\Controllers\AuctionController::class, 'index']);
Route::get('/auctions/statuses', [App\Http\Controllers\AuctionController::class, 'statuses']); // Public status endpoint
Route::get('/auctions/{id}', [App\Http\Controllers\AuctionController::class, 'show']);
Route::get('/auctions/{id}/bids', [App\Http\Controllers\AuctionController::class, 'getBidHistory']);
Route::post('/auctions/{id}/click', [App\Http\Controllers\AuctionController::class, 'trackClick']);

// Public profile routes (no auth required)
Route::get('/public/profile/{userId}', [App\Http\Controllers\PublicProfileController::class, 'show']);
Route::get('/public/profile/{userId}/ratings', [App\Http\Controllers\PublicProfileController::class, 'getRatings']);

// Support availability status (public ping)
Route::get('/support/availability', [SupportAvailabilityController::class, 'status']);

// Blog public
Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);

// Forum public
Route::get('/forum/categories', [ForumController::class, 'categories']);
Route::get('/forum/threads', [ForumController::class, 'listThreads']);
Route::get('/forum/threads/{slug}', [ForumController::class, 'showThread']);

// Guest offline support message
Route::post('/support/offline-message', [SupportOfflineMessageController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
  Route::post('/logout', [AuthController::class, 'logout']);
  Route::get('/user', [AuthController::class, 'user']);
  Route::post('/change-password', [AuthController::class, 'changePassword']);

  // User profile routes
  Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show']);
  Route::match(['put', 'post'], '/profile', [App\Http\Controllers\ProfileController::class, 'update']);
  Route::post('/profile/change-password', [App\Http\Controllers\ProfileController::class, 'changePassword']);
  Route::put('/profile/timezone', [App\Http\Controllers\ProfileController::class, 'updateTimezone']);

  // Dashboard statistics
  Route::get('/dashboard/stats', [App\Http\Controllers\DashboardStatsController::class, 'index']);

  // Wallet routes
  Route::get('/wallet/balance', [App\Http\Controllers\WalletController::class, 'getBalance']);
  Route::post('/wallet/deposit/initiate', [App\Http\Controllers\WalletController::class, 'initiateDeposit']);
  Route::get('/wallet/deposit/success', [App\Http\Controllers\WalletController::class, 'depositSuccess']);
  Route::get('/wallet/deposit/cancel', [App\Http\Controllers\WalletController::class, 'depositCancel']);
  Route::post('/wallet/withdraw', [App\Http\Controllers\WalletController::class, 'requestWithdrawal']);
  Route::get('/wallet/transactions', [App\Http\Controllers\WalletController::class, 'getTransactions']);

  // User live chat routes
  Route::post('/live-chat/create-or-get', [UserLiveChatController::class, 'createOrGetChat']);
  Route::get('/live-chat', [UserLiveChatController::class, 'show']);
  Route::post('/live-chat/send', [UserLiveChatController::class, 'sendMessage']);
  Route::post('/live-chat/mark-read', [UserLiveChatController::class, 'markRead']);

  // Orders (demo checkout)
  Route::post('/orders/checkout', [App\Http\Controllers\OrderController::class, 'checkout']);
  Route::get('/orders', [App\Http\Controllers\OrderController::class, 'index']);

  // Seller verification (eBook seller)
  Route::post('/seller-verification/payment/initiate', [SellerVerificationController::class, 'initiatePayment']);
  Route::get('/seller-verification/payment/success', [SellerVerificationController::class, 'paymentSuccess']);
  Route::get('/seller-verification/payment/cancel', [SellerVerificationController::class, 'paymentCancel']);

  // User ad management routes
  Route::prefix('user')->group(function () {
    Route::apiResource('ads', App\Http\Controllers\UserAdController::class);
    Route::post('ads/{id}/mark-sold', [App\Http\Controllers\UserAdController::class, 'markSold']);
    
    // User auction routes
    Route::get('auctions/my-auctions', [App\Http\Controllers\UserAuctionController::class, 'myAuctions']);
    Route::get('auctions/my-bids', [App\Http\Controllers\UserAuctionController::class, 'myBids']);
    Route::get('auctions/won', [App\Http\Controllers\UserAuctionController::class, 'wonAuctions']);
    Route::post('auctions', [App\Http\Controllers\UserAuctionController::class, 'store']);
    Route::put('auctions/{id}', [App\Http\Controllers\UserAuctionController::class, 'update']);
    Route::delete('auctions/{id}', [App\Http\Controllers\UserAuctionController::class, 'destroy']);
    Route::post('auctions/{id}/end', [App\Http\Controllers\UserAuctionController::class, 'endAuction']);
    Route::get('auctions/{id}/bid-history', [App\Http\Controllers\UserAuctionController::class, 'getBidHistory']);
  });

  // Increment ad view count (public but authenticated)
  Route::post('/ads/{id}/view', [App\Http\Controllers\UserAdController::class, 'incrementView']);

  // Place bid on auction (authenticated)
  Route::post('/auctions/{id}/bid', [App\Http\Controllers\AuctionController::class, 'placeBid']);
  Route::delete('/bids/{id}', [App\Http\Controllers\AuctionController::class, 'cancelBid']);
  Route::post('/auctions/{id}/buy-now', [App\Http\Controllers\AuctionController::class, 'buyNow']);
  Route::post('/auctions/{id}/payment/initiate', [App\Http\Controllers\AuctionPaymentController::class, 'initiatePayment']);
  Route::get('/auctions/{id}/payment/success', [App\Http\Controllers\AuctionPaymentController::class, 'paymentSuccess']);
  Route::get('/auctions/{id}/payment/cancel', [App\Http\Controllers\AuctionPaymentController::class, 'paymentCancel']);
  Route::post('/auctions/payment/webhook', [App\Http\Controllers\AuctionPaymentController::class, 'webhook']);

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

  // Blog (auth for future authoring extensions)
  // Forum create/reply
  Route::post('/forum/threads', [ForumController::class, 'createThread'])->middleware('throttle:3,1');
  Route::post('/forum/threads/{threadId}/reply', [ForumController::class, 'reply'])->middleware('throttle:6,1');
  Route::post('/forum/posts/{postId}/react', [ForumController::class, 'react'])->middleware('throttle:12,1');
  Route::post('/forum/posts/{postId}/report', [ForumController::class, 'report'])->middleware('throttle:6,1');

  // Analytics event tracking
  Route::post('/analytics/track', [AnalyticsController::class, 'track']);

  // User analytics summary
  Route::get('/me/analytics/summary', [AnalyticsController::class, 'userSummary']);

  // Inbox/Messaging routes
  Route::get('/inbox', [App\Http\Controllers\UserLiveChatController::class, 'index']);
  Route::get('/inbox/{id}', [App\Http\Controllers\UserLiveChatController::class, 'show']);
  Route::post('/inbox', [App\Http\Controllers\UserLiveChatController::class, 'store']);
  Route::post('/inbox/{id}/message', [App\Http\Controllers\UserLiveChatController::class, 'sendMessage']);

  // Bought Items routes
  Route::get('/bought-items', [App\Http\Controllers\BoughtItemsController::class, 'index']);

  // Items Selling routes (Seller Dashboard)
  Route::get('/items-selling', [App\Http\Controllers\ItemsSellingController::class, 'index']);
  Route::get('/items-selling/{id}', [App\Http\Controllers\ItemsSellingController::class, 'show']);

  // Buyer-Seller Messaging routes
  Route::get('/messages/conversation/{adId}', [App\Http\Controllers\BuyerSellerMessageController::class, 'getConversation']);
  Route::post('/messages/{adId}', [App\Http\Controllers\BuyerSellerMessageController::class, 'sendMessage']);
  Route::get('/messages/seller/conversations', [App\Http\Controllers\BuyerSellerMessageController::class, 'getSellerConversations']);
  Route::get('/messages/buyer/conversations', [App\Http\Controllers\BuyerSellerMessageController::class, 'getBuyerConversations']);
  
  // Auction messaging routes
  Route::get('/messages/auction/{auctionId}/conversation', [App\Http\Controllers\BuyerSellerMessageController::class, 'getAuctionConversation']);
  Route::post('/messages/auction/{auctionId}', [App\Http\Controllers\BuyerSellerMessageController::class, 'sendAuctionMessage']);

  // Seller Offer Management routes
  Route::get('/seller/offers', [App\Http\Controllers\SellerOfferController::class, 'index']);
  Route::post('/seller/offers', [App\Http\Controllers\SellerOfferController::class, 'store']);
  Route::put('/seller/offers/{id}', [App\Http\Controllers\SellerOfferController::class, 'update']);
  Route::delete('/seller/offers/{id}', [App\Http\Controllers\SellerOfferController::class, 'destroy']);
  Route::get('/seller/offers/ad/{adId}', [App\Http\Controllers\SellerOfferController::class, 'getAdOffers']);

  // Rating routes (user-facing)
  Route::get('/ratings/criteria', [App\Http\Controllers\RatingController::class, 'getCriteria']);
  Route::get('/ratings/seller/{sellerId}', [App\Http\Controllers\RatingController::class, 'getSellerRatings']);
  Route::get('/ratings/check/{adId?}', [App\Http\Controllers\RatingController::class, 'checkRating']); // adId is optional, can use ebook_id in query
  Route::post('/ratings', [App\Http\Controllers\RatingController::class, 'store']);
  Route::put('/ratings/{id}', [App\Http\Controllers\RatingController::class, 'update']);
  Route::delete('/ratings/{id}', [App\Http\Controllers\RatingController::class, 'destroy']);

  // eBook routes (public)
  Route::get('/ebooks', [App\Http\Controllers\EbookController::class, 'index']);
  Route::get('/ebooks/{id}', [App\Http\Controllers\EbookController::class, 'show']);
  Route::get('/ebooks/{id}/download', [App\Http\Controllers\EbookController::class, 'download']);

  // Seller eBook management routes (authenticated sellers only)
  Route::prefix('seller/ebooks')->group(function () {
    Route::get('/', [App\Http\Controllers\SellerEbookController::class, 'index']);
    Route::post('/', [App\Http\Controllers\SellerEbookController::class, 'store']);
    Route::get('/sales-report', [App\Http\Controllers\SellerEbookController::class, 'salesReport']);
    Route::get('/{id}', [App\Http\Controllers\SellerEbookController::class, 'show']);
    Route::put('/{id}', [App\Http\Controllers\SellerEbookController::class, 'update']);
    Route::delete('/{id}', [App\Http\Controllers\SellerEbookController::class, 'destroy']);
  });

  // eBook payment routes
  Route::post('/ebooks/{id}/payment/initiate', [App\Http\Controllers\EbookPaymentController::class, 'initiatePayment']);
  Route::get('/ebooks/payment/success', [App\Http\Controllers\EbookPaymentController::class, 'paymentSuccess']);
  Route::get('/ebooks/payment/cancel', [App\Http\Controllers\EbookPaymentController::class, 'paymentCancel']);
  Route::post('/ebooks/payment/webhook', [App\Http\Controllers\EbookPaymentController::class, 'webhook']);

  // Sales report route
  Route::get('/sales-report', [App\Http\Controllers\SalesReportController::class, 'index']);

  // Admin routes
  // Admin routes (Sanctum handles both token and session auth automatically for stateful domains) + admin role + presence heartbeat
  Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'admin.presence'])->group(function () {
    // Ads management
    Route::apiResource('ads', AdController::class);
    
    // Auctions management
    // IMPORTANT: statuses route must come BEFORE apiResource to avoid route conflicts
    Route::get('auctions/statuses', [AuctionController::class, 'statuses']); // Lightweight status-only endpoint
    Route::apiResource('auctions', AuctionController::class);
    Route::post('auctions/{id}/end', [AuctionController::class, 'endAuction']);
    Route::post('auctions/{id}/cancel', [AuctionController::class, 'cancelAuction']);
    Route::post('auctions/{id}/determine-winner', [AuctionController::class, 'determineWinner']);
    
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
    Route::post('live-chats/open', [LiveChatController::class, 'open']);
    Route::get('live-chats/{live_chat}/messages', [LiveChatMessageController::class, 'index']);
    Route::post('live-chats/{live_chat}/messages', [LiveChatMessageController::class, 'store']);
    Route::post('live-chats/{live_chat}/mark-read', [LiveChatMessageController::class, 'markAsRead']);

    // Support availability (admin)
    Route::post('support/availability', [SupportAvailabilityController::class, 'setAvailability']);
    Route::get('support/offline-messages', [SupportOfflineMessageController::class, 'index']);
    Route::get('support/offline-messages/{id}', [SupportOfflineMessageController::class, 'show']);
    Route::post('support/offline-messages/{id}/mark-read', [SupportOfflineMessageController::class, 'markAsRead']);

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
    
    // Wallet Management (Withdrawals)
    Route::get('wallet/transactions', [App\Http\Controllers\Admin\WalletController::class, 'getAllWalletTransactions']);
    Route::get('wallet/withdrawals', [App\Http\Controllers\Admin\WalletController::class, 'getAllWithdrawals']);
    Route::get('wallet/withdrawals/pending', [App\Http\Controllers\Admin\WalletController::class, 'getPendingWithdrawals']);
    Route::post('wallet/withdrawals/{id}/approve', [App\Http\Controllers\Admin\WalletController::class, 'approveWithdrawal']);
    Route::post('wallet/withdrawals/{id}/reject', [App\Http\Controllers\Admin\WalletController::class, 'rejectWithdrawal']);

    // eBook Management
    Route::apiResource('ebooks', EbookController::class);

    // Blog admin
    Route::get('blog/posts', [BlogAdminController::class, 'index']);
    Route::post('blog/posts', [BlogAdminController::class, 'store']);
    Route::put('blog/posts/{id}', [BlogAdminController::class, 'update']);
    Route::delete('blog/posts/{id}', [BlogAdminController::class, 'destroy']);

    // Forum admin
    Route::get('forum/reports', [ForumAdminController::class, 'listReports']);
    Route::post('forum/reports/{id}/resolve', [ForumAdminController::class, 'resolveReport']);
    Route::delete('forum/posts/{id}', [ForumAdminController::class, 'deletePost']);
    Route::post('forum/threads/{id}/lock', [ForumAdminController::class, 'lockThread']);
    Route::post('forum/threads/{id}/unlock', [ForumAdminController::class, 'unlockThread']);
    Route::post('forum/threads/{id}/sticky', [ForumAdminController::class, 'stickyThread']);
    Route::post('forum/threads/{id}/unsticky', [ForumAdminController::class, 'unstickyThread']);

    // Admin analytics summary
    Route::get('analytics/summary', [AnalyticsController::class, 'adminSummary']);
  });
});