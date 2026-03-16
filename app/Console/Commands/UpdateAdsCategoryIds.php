<?php

namespace App\Console\Commands;

use App\Models\Ad;
use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateAdsCategoryIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ads:update-category-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update existing ads with appropriate category IDs based on their titles';

    /**
     * Category keyword mappings
     */
    protected $categoryKeywords = [
        'Property' => ['land', 'house', 'apartment', 'property', 'real estate', 'building', 'home', 'residence', 'villa', 'flat', 'condo'],
        'Vehicle' => ['car', 'truck', 'bus', 'motorcycle', 'bike', 'scooter', 'vehicle', 'automobile', 'honda', 'toyota', 'yamaha', 'isuzu', 'tata', 'corolla', 'cb', 'fz'],
        'Furniture' => ['sofa', 'table', 'chair', 'bed', 'furniture', 'cabinet', 'wardrobe', 'desk'],
        'Mobile phone & Gadgets' => ['phone', 'smartphone', 'iphone', 'android', 'gadget', 'mobile', 'tablet', 'ipad'],
        'IT & Computers' => ['laptop', 'computer', 'macbook', 'pc', 'desktop', 'monitor', 'keyboard', 'mouse'],
        'Clothes & Fashion' => ['clothing', 'dress', 'shirt', 'pants', 'fashion', 'apparel', 'handbag', 'bag', 'jewelry'],
        'Sports & Recreation' => ['sports', 'equipment', 'bicycle', 'bike', 'fitness', 'gym', 'exercise'],
        'Home & Garden' => ['garden', 'tools', 'appliance', 'kitchen', 'home'],
        'Books & Magazine' => ['book', 'magazine', 'novel', 'textbook', 'comic'],
        'Art & Craft' => ['art', 'painting', 'sculpture', 'craft', 'drawing'],
        'Music & Musical instrument' => ['guitar', 'piano', 'music', 'instrument', 'audio'],
        'Photography' => ['camera', 'photography', 'lens', 'photo'],
        'Health & Beauty' => ['beauty', 'skincare', 'cosmetic', 'health'],
        'Pets & Animal' => ['pet', 'dog', 'cat', 'animal'],
        'Jobs' => ['job', 'employment', 'career', 'position', 'vacancy'],
        'Business for Sale' => ['business', 'shop', 'store', 'commercial'],
        'Building & Construction' => ['construction', 'material', 'cement', 'brick', 'steel'],
        'Farming & Agriculture' => ['farm', 'agriculture', 'crop', 'seed', 'farming'],
        'Travel & Tourism' => ['travel', 'tourism', 'tour', 'ticket', 'hotel'],
        'Events/Tickets' => ['event', 'ticket', 'concert', 'show'],
        'Office Supply' => ['office', 'stationery', 'supply'],
        'Jewelers' => ['jewelry', 'gold', 'silver', 'diamond', 'ring', 'necklace'],
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to update ads with appropriate category IDs...');
        
        // Get all main categories (where sub_category is null)
        // If none found, get unique category names and use the first category for each name
        $categories = Category::whereNull('sub_category')
            ->get()
            ->keyBy('category');
        
        // If no main categories found, try to get unique category names
        if ($categories->isEmpty()) {
            $categoryNames = Category::distinct()->pluck('category')->unique();
            $categories = collect();
            
            foreach ($categoryNames as $categoryName) {
                $firstCategory = Category::where('category', $categoryName)->first();
                if ($firstCategory) {
                    $categories[$categoryName] = $firstCategory;
                }
            }
        }
        
        if ($categories->isEmpty()) {
            $this->error('No categories found in the database!');
            $this->info('Please run: php artisan db:seed --class=CategorySeeder');
            return 1;
        }
        
        $this->info('Found ' . $categories->count() . ' main categories.');
        
        // Get all ads
        $ads = Ad::all();
        
        if ($ads->isEmpty()) {
            $this->info('No ads found to update.');
            return 0;
        }
        
        $this->info('Found ' . $ads->count() . ' ads to process.');
        $this->newLine();
        
        $updated = 0;
        $skipped = 0;
        $notFound = [];
        
        foreach ($ads as $ad) {
            $title = strtolower($ad->title);
            $matchedCategory = null;
            $matchedKeywords = [];
            
            // Try to match category based on keywords
            foreach ($this->categoryKeywords as $categoryName => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($title, strtolower($keyword))) {
                        if ($categories->has($categoryName)) {
                            $matchedCategory = $categories[$categoryName];
                            $matchedKeywords[] = $keyword;
                        }
                        break 2; // Break out of both loops once we find a match
                    }
                }
            }
            
            if ($matchedCategory && $ad->category_id != $matchedCategory->id) {
                $oldCategory = Category::find($ad->category_id);
                $oldCategoryName = $oldCategory ? $oldCategory->category : 'Unknown';
                
                DB::table('ads')
                    ->where('id', $ad->id)
                    ->update(['category_id' => $matchedCategory->id]);
                
                $this->line("✓ Updated Ad #{$ad->id}: '{$ad->title}'");
                $this->line("  From: {$oldCategoryName} (ID: {$ad->category_id})");
                $this->line("  To: {$matchedCategory->category} (ID: {$matchedCategory->id})");
                $this->line("  Matched keywords: " . implode(', ', $matchedKeywords));
                $this->newLine();
                
                $updated++;
            } elseif (!$matchedCategory) {
                $notFound[] = [
                    'id' => $ad->id,
                    'title' => $ad->title,
                    'current_category_id' => $ad->category_id
                ];
                $skipped++;
            } else {
                $skipped++;
            }
        }
        
        // Summary
        $this->newLine();
        $this->info('=== Update Summary ===');
        $this->info("Total ads processed: {$ads->count()}");
        $this->info("Updated: {$updated}");
        $this->info("Skipped (already correct or no match): {$skipped}");
        
        if (!empty($notFound)) {
            $this->newLine();
            $this->warn('Ads that could not be matched to a category:');
            foreach ($notFound as $ad) {
                $currentCategory = Category::find($ad['current_category_id']);
                $currentCategoryName = $currentCategory ? $currentCategory->category : 'Unknown';
                $this->line("  - Ad #{$ad['id']}: '{$ad['title']}' (Current: {$currentCategoryName})");
            }
        }
        
        $this->newLine();
        $this->info('Update completed!');
        
        return 0;
    }
}
