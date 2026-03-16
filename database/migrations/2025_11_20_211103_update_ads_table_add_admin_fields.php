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
    Schema::table('ads', function (Blueprint $table) {
      $table->integer('views')->default(0)->after('price');
      $table->enum('posted_by', ['user', 'vendor', 'admin'])->default('user')->after('user_id');
      $table->boolean('item_sold')->default(false)->after('views');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('ads', function (Blueprint $table) {
      $table->dropColumn(['views', 'posted_by', 'item_sold']);
    });
  }
};
