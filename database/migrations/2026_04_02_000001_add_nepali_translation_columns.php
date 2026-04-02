<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            if (!Schema::hasColumn('ads', 'title_ne')) {
                $table->string('title_ne')->nullable()->after('title');
            }
            if (!Schema::hasColumn('ads', 'description_ne')) {
                $table->text('description_ne')->nullable()->after('description');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'domain_category_ne')) {
                $table->string('domain_category_ne')->nullable()->after('domain_category');
            }
            if (!Schema::hasColumn('categories', 'field_category_ne')) {
                $table->string('field_category_ne')->nullable()->after('field_category');
            }
            if (!Schema::hasColumn('categories', 'item_category_ne')) {
                $table->string('item_category_ne')->nullable()->after('item_category');
            }
        });

        Schema::table('locations', function (Blueprint $table) {
            if (!Schema::hasColumn('locations', 'province_ne')) {
                $table->string('province_ne')->nullable()->after('province');
            }
            if (!Schema::hasColumn('locations', 'district_ne')) {
                $table->string('district_ne')->nullable()->after('district');
            }
            if (!Schema::hasColumn('locations', 'local_level_ne')) {
                $table->string('local_level_ne')->nullable()->after('local_level');
            }
            if (!Schema::hasColumn('locations', 'local_level_type_ne')) {
                $table->string('local_level_type_ne')->nullable()->after('local_level_type');
            }
            if (!Schema::hasColumn('locations', 'local_address_ne')) {
                $table->text('local_address_ne')->nullable()->after('local_address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            if (Schema::hasColumn('ads', 'title_ne')) {
                $table->dropColumn('title_ne');
            }
            if (Schema::hasColumn('ads', 'description_ne')) {
                $table->dropColumn('description_ne');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'domain_category_ne')) {
                $table->dropColumn('domain_category_ne');
            }
            if (Schema::hasColumn('categories', 'field_category_ne')) {
                $table->dropColumn('field_category_ne');
            }
            if (Schema::hasColumn('categories', 'item_category_ne')) {
                $table->dropColumn('item_category_ne');
            }
        });

        Schema::table('locations', function (Blueprint $table) {
            if (Schema::hasColumn('locations', 'province_ne')) {
                $table->dropColumn('province_ne');
            }
            if (Schema::hasColumn('locations', 'district_ne')) {
                $table->dropColumn('district_ne');
            }
            if (Schema::hasColumn('locations', 'local_level_ne')) {
                $table->dropColumn('local_level_ne');
            }
            if (Schema::hasColumn('locations', 'local_level_type_ne')) {
                $table->dropColumn('local_level_type_ne');
            }
            if (Schema::hasColumn('locations', 'local_address_ne')) {
                $table->dropColumn('local_address_ne');
            }
        });
    }
};

