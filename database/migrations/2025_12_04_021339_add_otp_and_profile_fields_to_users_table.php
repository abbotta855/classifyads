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
        Schema::table('users', function (Blueprint $table) {
            // OTP fields
            $table->string('otp_code', 6)->nullable()->after('email_verified_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->boolean('is_verified')->default(false)->after('otp_expires_at');
            
            // Profile fields
            $table->date('dob')->nullable()->after('is_verified');
            $table->string('phone', 20)->nullable()->after('dob');
            $table->string('profile_picture', 500)->nullable()->after('phone');
            $table->timestamp('last_login_at')->nullable()->after('profile_picture');
            
            // Index for OTP lookups
            $table->index('otp_code');
            $table->index('is_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['otp_code']);
            $table->dropIndex(['is_verified']);
            $table->dropColumn([
                'otp_code',
                'otp_expires_at',
                'is_verified',
                'dob',
                'phone',
                'profile_picture',
                'last_login_at'
            ]);
        });
    }
};
