<?php

namespace App\Console\Commands;

use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteNullSubcategoryCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:delete-null-subcategories';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete categories where sub_category is null';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for categories with null sub_category...');
        
        $nullSubcategoryCategories = Category::whereNull('sub_category')->get();
        $count = $nullSubcategoryCategories->count();
        
        if ($count === 0) {
            $this->info('No categories with null sub_category found.');
            return 0;
        }
        
        $this->warn("Found {$count} categories with null sub_category.");
        
        // Check which categories are being used by ads
        $usedCategoryIds = DB::table('ads')
            ->whereIn('category_id', $nullSubcategoryCategories->pluck('id'))
            ->distinct()
            ->pluck('category_id')
            ->toArray();
        
        if (!empty($usedCategoryIds)) {
            $this->error("Cannot delete categories that are being used by ads.");
            $this->info("Categories in use: " . implode(', ', $usedCategoryIds));
            $this->info("These categories are referenced by ads and cannot be deleted due to foreign key constraints.");
            
            // Find subcategories for the same main categories
            $this->info("\nAttempting to update ads to use subcategories instead...");
            
            foreach ($usedCategoryIds as $categoryId) {
                $category = Category::find($categoryId);
                if ($category) {
                    // Find a subcategory with the same main category name
                    $subcategory = Category::where('category', $category->category)
                        ->whereNotNull('sub_category')
                        ->first();
                    
                    if ($subcategory) {
                        $adsCount = DB::table('ads')->where('category_id', $categoryId)->count();
                        DB::table('ads')->where('category_id', $categoryId)->update(['category_id' => $subcategory->id]);
                        $this->info("Updated {$adsCount} ads from category ID {$categoryId} to subcategory ID {$subcategory->id}");
                    } else {
                        $this->warn("No subcategory found for category '{$category->category}'. Cannot update ads.");
                    }
                }
            }
        }
        
        // Now delete categories that are not being used
        $categoriesToDelete = Category::whereNull('sub_category')
            ->whereNotIn('id', $usedCategoryIds)
            ->get();
        
        $deletableCount = $categoriesToDelete->count();
        
        if ($deletableCount > 0) {
            if ($this->confirm("Delete {$deletableCount} unused categories with null sub_category?", true)) {
                $deleted = Category::whereNull('sub_category')
                    ->whereNotIn('id', $usedCategoryIds)
                    ->delete();
                $this->info("Successfully deleted {$deleted} unused categories.");
            }
        }
        
        // Try to delete the ones that were updated
        if (!empty($usedCategoryIds)) {
            $remainingUsed = DB::table('ads')
                ->whereIn('category_id', $usedCategoryIds)
                ->distinct()
                ->pluck('category_id')
                ->toArray();
            
            if (empty($remainingUsed)) {
                if ($this->confirm("All ads have been updated. Delete the remaining categories with null sub_category?", true)) {
                    $deleted = Category::whereNull('sub_category')->delete();
                    $this->info("Successfully deleted {$deleted} categories.");
                }
            } else {
                $this->warn("Some categories are still in use and cannot be deleted: " . implode(', ', $remainingUsed));
            }
        }
        
        return 0;
    }
}
