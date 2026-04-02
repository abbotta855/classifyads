<?php

namespace App\Console\Commands;

use App\Models\Ad;
use App\Models\Category;
use App\Models\Location;
use App\Services\NepaliAutoTranslationService;
use Illuminate\Console\Command;

class BackfillNepaliTranslations extends Command
{
    protected $signature = 'translations:backfill-nepali {--chunk=100 : Chunk size for batch processing}';

    protected $description = 'Fill missing Nepali translations for ads, categories, and locations.';

    public function handle(NepaliAutoTranslationService $translator): int
    {
        $chunk = max(10, (int) $this->option('chunk'));

        $this->info('Backfilling missing Nepali translations...');

        $adCount = 0;
        Ad::query()
            ->where(function ($q) {
                $q->whereNull('title_ne')
                    ->orWhereNull('description_ne');
            })
            ->chunkById($chunk, function ($ads) use (&$adCount, $translator) {
                foreach ($ads as $ad) {
                    $updates = [];
                    if (empty($ad->title_ne) && !empty($ad->title)) {
                        $updates['title_ne'] = $translator->translateToNepali($ad->title);
                    }
                    if (empty($ad->description_ne) && !empty($ad->description)) {
                        $updates['description_ne'] = $translator->translateToNepali($ad->description);
                    }
                    if (!empty($updates)) {
                        $ad->update($updates);
                        $adCount++;
                    }
                }
            });

        $categoryCount = 0;
        Category::query()
            ->where(function ($q) {
                $q->whereNull('domain_category_ne')
                    ->orWhereNull('field_category_ne')
                    ->orWhereNull('item_category_ne');
            })
            ->chunkById($chunk, function ($categories) use (&$categoryCount, $translator) {
                foreach ($categories as $category) {
                    $updates = [];
                    if (empty($category->domain_category_ne) && !empty($category->domain_category)) {
                        $updates['domain_category_ne'] = $translator->translateToNepali($category->domain_category);
                    }
                    if (empty($category->field_category_ne) && !empty($category->field_category)) {
                        $updates['field_category_ne'] = $translator->translateToNepali($category->field_category);
                    }
                    if (empty($category->item_category_ne) && !empty($category->item_category)) {
                        $updates['item_category_ne'] = $translator->translateToNepali($category->item_category);
                    }
                    if (!empty($updates)) {
                        $category->update($updates);
                        $categoryCount++;
                    }
                }
            });

        $locationCount = 0;
        Location::query()
            ->where(function ($q) {
                $q->whereNull('province_ne')
                    ->orWhereNull('district_ne')
                    ->orWhereNull('local_level_ne')
                    ->orWhereNull('local_level_type_ne')
                    ->orWhereNull('local_address_ne');
            })
            ->chunkById($chunk, function ($locations) use (&$locationCount, $translator) {
                foreach ($locations as $location) {
                    $updates = [];
                    if (empty($location->province_ne) && !empty($location->province)) {
                        $updates['province_ne'] = $translator->translateToNepali($location->province);
                    }
                    if (empty($location->district_ne) && !empty($location->district)) {
                        $updates['district_ne'] = $translator->translateToNepali($location->district);
                    }
                    if (empty($location->local_level_ne) && !empty($location->local_level)) {
                        $updates['local_level_ne'] = $translator->translateToNepali($location->local_level);
                    }
                    if (empty($location->local_level_type_ne) && !empty($location->local_level_type)) {
                        $updates['local_level_type_ne'] = $translator->translateToNepali($location->local_level_type);
                    }
                    if (empty($location->local_address_ne) && !empty($location->local_address)) {
                        $updates['local_address_ne'] = $translator->translateToNepali($location->local_address);
                    }
                    if (!empty($updates)) {
                        $location->update($updates);
                        $locationCount++;
                    }
                }
            });

        $this->info("Done. Ads updated: {$adCount}, categories updated: {$categoryCount}, locations updated: {$locationCount}");

        return self::SUCCESS;
    }
}

