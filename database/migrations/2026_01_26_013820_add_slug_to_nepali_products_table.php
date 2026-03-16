<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\NepaliProduct;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Generate slugs for existing records that don't have one
        $products = NepaliProduct::whereNull('slug')->orWhere('slug', '')->get();
        foreach ($products as $product) {
            $slugBase = Str::slug($product->title);
            $slug = $slugBase;
            $i = 1;
            while (NepaliProduct::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $slugBase . '-' . $i;
                $i++;
            }
            $product->update(['slug' => $slug]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to reverse - we're just populating data
    }
};
