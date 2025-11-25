<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if super admin already exists
        $superAdmin = User::where('email', 'shushilknp@gmail.com')->first();

        if (!$superAdmin) {
            User::create([
                'name' => 'Shushilknp',
                'email' => 'shushilknp@gmail.com',
                'password' => Hash::make('Shushil3141592'),
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ]);

            $this->command->info('Super admin user created successfully!');
            $this->command->info('Email: shushilknp@gmail.com');
            $this->command->info('Password: Shushil3141592');
        } else {
            // Update existing user to super admin
            $superAdmin->update([
                'name' => 'Shushilknp',
                'password' => Hash::make('Shushil3141592'),
                'role' => 'super_admin',
            ]);

            $this->command->info('Super admin user updated successfully!');
        }
    }
}

