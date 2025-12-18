<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Generate slugs for all existing ads that don't have one
        \App\Models\Ad::whereNull('slug')
            ->orWhere('slug', '')
            ->chunk(100, function ($ads) {
                foreach ($ads as $ad) {
                    if (empty($ad->slug) && !empty($ad->title)) {
                        $ad->slug = \App\Models\Ad::generateSlug($ad->title, $ad->id);
                        $ad->save();
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally clear slugs (but we'll keep them for SEO)
        // \App\Models\Ad::whereNotNull('slug')->update(['slug' => null]);
    }
};
