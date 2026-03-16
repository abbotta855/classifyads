<?php

namespace App\Services;

use App\Models\Ad;
use App\Models\SavedSearch;
use App\Models\UserNotification;

class SavedSearchNotificationService
{
    /**
     * Create notifications for all saved searches that match an ad
     */
    public function notifyMatchingSearches(Ad $ad, array $matchingSearches): void
    {
        foreach ($matchingSearches as $savedSearch) {
            $this->createNotification($ad, $savedSearch);
            $this->updateSavedSearchStats($savedSearch);
        }
    }

    /**
     * Create a notification for a single saved search match
     */
    protected function createNotification(Ad $ad, SavedSearch $savedSearch): void
    {
        try {
            // Build notification message
            $message = "A new ad matches your saved search: \"{$savedSearch->name}\"";
            
            if ($ad->title) {
                $message .= " - {$ad->title}";
            }

            // Create notification
            $notification = UserNotification::create([
                'user_id' => $savedSearch->user_id,
                'type' => 'new_match',
                'title' => 'New Match Found!',
                'message' => $message,
                'is_read' => false,
                'related_ad_id' => $ad->id,
                'link' => "/ads/{$ad->id}",
                'metadata' => [
                    'saved_search_id' => $savedSearch->id,
                    'saved_search_name' => $savedSearch->name,
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'ad_price' => $ad->price,
                    'ad_category' => $ad->category ? $ad->category->category : null,
                ],
            ]);

            \Log::info('Notification created successfully', [
                'notification_id' => $notification->id,
                'user_id' => $savedSearch->user_id,
                'ad_id' => $ad->id,
                'saved_search_id' => $savedSearch->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create notification', [
                'user_id' => $savedSearch->user_id,
                'ad_id' => $ad->id,
                'saved_search_id' => $savedSearch->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Update saved search statistics
     */
    protected function updateSavedSearchStats(SavedSearch $savedSearch): void
    {
        $savedSearch->increment('alert_count');
        $savedSearch->update(['last_alert_at' => now()]);
    }

    /**
     * Process an ad and notify all matching saved searches
     */
    public function processAd(Ad $ad): void
    {
        try {
            \Log::info('Processing saved search notifications for ad', [
                'ad_id' => $ad->id,
                'ad_title' => $ad->title,
                'ad_category_id' => $ad->category_id,
                'ad_location_id' => $ad->location_id,
            ]);

            $matcher = new SavedSearchMatcher();
            $matchingSearches = $matcher->findMatchingSearches($ad);

            \Log::info('Found matching saved searches', [
                'ad_id' => $ad->id,
                'matching_count' => count($matchingSearches),
            ]);

            if (!empty($matchingSearches)) {
                $this->notifyMatchingSearches($ad, $matchingSearches);
                \Log::info('Notifications created for matching saved searches', [
                    'ad_id' => $ad->id,
                    'notifications_created' => count($matchingSearches),
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Error processing saved search notifications', [
                'ad_id' => $ad->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}

