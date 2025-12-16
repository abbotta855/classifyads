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
        Schema::table('ebooks', function (Blueprint $table) {
            // Remove old ad_id relationship if it exists
            if (Schema::hasColumn('ebooks', 'ad_id')) {
                try {
                    $table->dropForeign(['ad_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist
                }
                $table->dropColumn('ad_id');
            }
            
            // Add user_id if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'user_id')) {
                $table->foreignId('user_id')->after('id')->constrained()->onDelete('cascade');
            }
            
            // Add category_id if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
            }
            
            // Add title if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'title')) {
                $table->string('title', 255)->after('category_id');
            }
            
            // Add description if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            
            // Rename author to writer if author exists
            if (Schema::hasColumn('ebooks', 'author') && !Schema::hasColumn('ebooks', 'writer')) {
                Schema::table('ebooks', function (Blueprint $table) {
                    $table->renameColumn('author', 'writer');
                });
            } elseif (!Schema::hasColumn('ebooks', 'writer')) {
                $table->string('writer', 255)->nullable()->after('description');
            }
            
            // Add other book details
            if (!Schema::hasColumn('ebooks', 'language')) {
                $table->string('language', 50)->nullable()->after('writer');
            }
            if (!Schema::hasColumn('ebooks', 'pages')) {
                $table->integer('pages')->nullable()->after('language');
            }
            if (!Schema::hasColumn('ebooks', 'book_size')) {
                $table->string('book_size', 50)->nullable()->after('pages');
            }
            if (!Schema::hasColumn('ebooks', 'file_format')) {
                $table->string('file_format', 50)->nullable()->after('book_size');
            }
            
            // Handle file_url vs file_path
            if (Schema::hasColumn('ebooks', 'file_path') && !Schema::hasColumn('ebooks', 'file_url')) {
                // Rename file_path to file_url
                Schema::table('ebooks', function (Blueprint $table) {
                    $table->renameColumn('file_path', 'file_url');
                });
            } elseif (!Schema::hasColumn('ebooks', 'file_url')) {
                $table->string('file_url', 500)->after('file_format');
            }
            
            // Add file_name if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'file_name')) {
                $table->string('file_name', 255)->nullable()->after('file_url');
            }
            
            // Add file_size if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'file_size')) {
                $table->bigInteger('file_size')->nullable()->after('file_name');
            }
            
            // Add file_type if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'file_type')) {
                $table->string('file_type', 50)->nullable()->after('file_size');
            }
            
            // Add cover_image if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'cover_image')) {
                $table->string('cover_image', 500)->nullable()->after('file_type');
            }
            
            // Publisher information
            if (!Schema::hasColumn('ebooks', 'publisher_name')) {
                $table->string('publisher_name', 255)->nullable()->after('cover_image');
            }
            if (!Schema::hasColumn('ebooks', 'publisher_address')) {
                $table->text('publisher_address')->nullable()->after('publisher_name');
            }
            if (!Schema::hasColumn('ebooks', 'publisher_website')) {
                $table->string('publisher_website', 500)->nullable()->after('publisher_address');
            }
            if (!Schema::hasColumn('ebooks', 'publisher_email')) {
                $table->string('publisher_email', 255)->nullable()->after('publisher_website');
            }
            if (!Schema::hasColumn('ebooks', 'publisher_phone')) {
                $table->string('publisher_phone', 50)->nullable()->after('publisher_email');
            }
            
            // Copyright and book type
            if (!Schema::hasColumn('ebooks', 'copyright_declared')) {
                $table->boolean('copyright_declared')->default(false)->after('publisher_phone');
            }
            if (!Schema::hasColumn('ebooks', 'book_type')) {
                $table->enum('book_type', ['ebook', 'hard_copy', 'both'])->default('ebook')->after('copyright_declared');
            }
            
            // Hard copy shipping information
            if (!Schema::hasColumn('ebooks', 'shipping_cost')) {
                $table->decimal('shipping_cost', 10, 2)->nullable()->after('book_type');
            }
            if (!Schema::hasColumn('ebooks', 'delivery_time')) {
                $table->string('delivery_time', 100)->nullable()->after('shipping_cost');
            }
            
            // Rating and statistics
            if (!Schema::hasColumn('ebooks', 'overall_rating')) {
                $table->decimal('overall_rating', 3, 2)->default(0)->after('delivery_time');
            }
            if (!Schema::hasColumn('ebooks', 'purchase_count')) {
                $table->integer('purchase_count')->default(0)->after('overall_rating');
            }
            
            // Status field
            if (!Schema::hasColumn('ebooks', 'status')) {
                $table->enum('status', ['draft', 'active', 'inactive', 'removed'])->default('draft')->after('purchase_count');
            }
            
            // Add download_count if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'download_count')) {
                $table->integer('download_count')->default(0)->after('purchase_count');
            }
            
            // Add unlocked if it doesn't exist
            if (!Schema::hasColumn('ebooks', 'unlocked')) {
                $table->boolean('unlocked')->default(false)->after('status');
            }
            
            // Make price nullable if needed
            if (Schema::hasColumn('ebooks', 'price')) {
                $table->decimal('price', 10, 2)->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This down migration is complex due to conditional columns
        // In practice, you may want to manually handle rollback if needed
        Schema::table('ebooks', function (Blueprint $table) {
            $columnsToDrop = [
                'language',
                'pages',
                'book_size',
                'file_format',
                'publisher_name',
                'publisher_address',
                'publisher_website',
                'publisher_email',
                'publisher_phone',
                'copyright_declared',
                'book_type',
                'shipping_cost',
                'delivery_time',
                'overall_rating',
            ];
            
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('ebooks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
