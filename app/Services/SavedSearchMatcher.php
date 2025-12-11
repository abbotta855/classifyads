<?php

namespace App\Services;

use App\Models\Ad;
use App\Models\SavedSearch;

class SavedSearchMatcher
{
    /**
     * Check if an ad matches a saved search criteria
     */
    public function matches(Ad $ad, SavedSearch $savedSearch): bool
    {
        // If saved search is inactive, don't match
        if (!$savedSearch->is_active) {
            return false;
        }

        // Don't notify user about their own ads
        if ($ad->user_id === $savedSearch->user_id) {
            return false;
        }

        // Check category match
        if (!$this->matchesCategory($ad, $savedSearch)) {
            return false;
        }

        // Check location match
        if (!$this->matchesLocation($ad, $savedSearch)) {
            return false;
        }

        // Check price range match
        if (!$this->matchesPriceRange($ad, $savedSearch)) {
            return false;
        }

        // Check keywords match
        if (!$this->matchesKeywords($ad, $savedSearch)) {
            return false;
        }

        // All criteria matched
        return true;
    }

    /**
     * Check if ad category matches saved search category
     */
    protected function matchesCategory(Ad $ad, SavedSearch $savedSearch): bool
    {
        // If no category specified in saved search, match all
        if (!$savedSearch->category_id) {
            return true;
        }

        // If ad has no category, no match
        if (!$ad->category_id) {
            return false;
        }

        // Load category relationships if not loaded
        if (!$ad->relationLoaded('category')) {
            $ad->load('category');
        }
        if (!$savedSearch->relationLoaded('category')) {
            $savedSearch->load('category');
        }

        // Exact category match
        if ($ad->category_id === $savedSearch->category_id) {
            return true;
        }

        // Check if saved search category is a main category and ad is in a subcategory
        // If saved search is for main category, match any subcategory under it
        if ($savedSearch->category && $ad->category) {
            // If saved search category has no sub_category (it's a main category)
            // and ad's category has the same main category name
            if (!$savedSearch->category->sub_category && 
                $savedSearch->category->category === $ad->category->category) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if ad location matches saved search location
     */
    protected function matchesLocation(Ad $ad, SavedSearch $savedSearch): bool
    {
        // If no location specified in saved search, match all locations
        if (!$savedSearch->location_id) {
            return true;
        }

        // If ad has no location, no match
        if (!$ad->location_id) {
            return false;
        }

        // Exact location match (ward level)
        if ($ad->location_id === $savedSearch->location_id) {
            return true;
        }

        // Load location relationships if not loaded
        if (!$ad->relationLoaded('location')) {
            $ad->load('location');
        }
        if (!$savedSearch->relationLoaded('location')) {
            $savedSearch->load('location');
        }

        // If locations don't exist, no match
        if (!$ad->location || !$savedSearch->location) {
            return false;
        }

        // Match if same province, district, and local level (broader match)
        // This allows users to get alerts for their area even if ward is different
        if ($ad->location->province === $savedSearch->location->province &&
            $ad->location->district === $savedSearch->location->district &&
            $ad->location->local_level === $savedSearch->location->local_level) {
            return true;
        }

        return false;
    }

    /**
     * Check if ad price matches saved search price range
     */
    protected function matchesPriceRange(Ad $ad, SavedSearch $savedSearch): bool
    {
        $adPrice = (float) $ad->price;

        // Check minimum price
        if ($savedSearch->min_price !== null && $adPrice < (float) $savedSearch->min_price) {
            return false;
        }

        // Check maximum price
        if ($savedSearch->max_price !== null && $adPrice > (float) $savedSearch->max_price) {
            return false;
        }

        return true;
    }

    /**
     * Check if ad matches saved search keywords
     */
    protected function matchesKeywords(Ad $ad, SavedSearch $savedSearch): bool
    {
        // If no keywords specified, match all
        if (!$savedSearch->search_query || trim($savedSearch->search_query) === '') {
            return true;
        }

        $keywords = strtolower(trim($savedSearch->search_query));
        $adTitle = strtolower($ad->title ?? '');
        $adDescription = strtolower($ad->description ?? '');

        // Check if keywords appear in title or description
        // Split keywords by space and check if all words appear
        $keywordArray = explode(' ', $keywords);
        $allKeywordsMatch = true;

        foreach ($keywordArray as $keyword) {
            $keyword = trim($keyword);
            if ($keyword === '') continue;

            if (strpos($adTitle, $keyword) === false && 
                strpos($adDescription, $keyword) === false) {
                $allKeywordsMatch = false;
                break;
            }
        }

        return $allKeywordsMatch;
    }

    /**
     * Find all saved searches that match a given ad
     */
    public function findMatchingSearches(Ad $ad): array
    {
        // Get all active saved searches
        $savedSearches = SavedSearch::where('is_active', true)
            ->with(['category', 'location'])
            ->get();

        $matchingSearches = [];

        foreach ($savedSearches as $savedSearch) {
            if ($this->matches($ad, $savedSearch)) {
                $matchingSearches[] = $savedSearch;
            }
        }

        return $matchingSearches;
    }
}

