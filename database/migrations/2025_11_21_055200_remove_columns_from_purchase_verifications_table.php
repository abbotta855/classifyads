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
    Schema::table('purchase_verifications', function (Blueprint $table) {
      $table->dropForeign(['ad_id']);
      $table->dropColumn(['ad_id', 'created_at', 'updated_at']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('purchase_verifications', function (Blueprint $table) {
      $table->foreignId('ad_id')->nullable()->after('id')->constrained()->onDelete('cascade');
      $table->timestamps();
    });
  }
};
