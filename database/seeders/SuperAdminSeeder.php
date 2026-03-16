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
        // IMPORTANT: Only allow 1 super admin in the system
        // First, check if any super admin already exists
        $existingSuperAdmin = User::where('role', 'super_admin')->first();

        if ($existingSuperAdmin) {
            // If super admin exists and it's not the target email, don't create/update
            if ($existingSuperAdmin->email !== 'shushilknp@gmail.com') {
                $this->command->warn('Super admin already exists with email: ' . $existingSuperAdmin->email);
                $this->command->warn('Only one super admin is allowed. Skipping creation.');
                return;
            }
        }

        // Check if target user exists
        $superAdmin = User::where('email', 'shushilknp@gmail.com')->first();

        if (!$superAdmin) {
            // Before creating, ensure no other super admin exists
            if ($existingSuperAdmin && $existingSuperAdmin->email !== 'shushilknp@gmail.com') {
                $this->command->warn('Super admin already exists. Only one super admin is allowed.');
                return;
            }

            User::create([
                'name' => 'Shushilknp',
                'email' => 'shushilknp@gmail.com',
                'password' => Hash::make('Shushil3141592'),
                'role' => 'super_admin',
                'is_verified' => true,
                'email_verified_at' => now(),
            ]);

            $this->command->info('Super admin user created successfully!');
            $this->command->info('Email: shushilknp@gmail.com');
            $this->command->info('Password: Shushil3141592');
        } else {
            // If user exists but is not super admin, check if we can upgrade
            if ($superAdmin->role === 'super_admin') {
                // Already super admin, just update password and verification
                $superAdmin->update([
                    'name' => 'Shushilknp',
                    'password' => Hash::make('Shushil3141592'),
                    'is_verified' => true,
                    'email_verified_at' => now(),
                ]);
                $this->command->info('Super admin user updated successfully!');
            } else {
                // User exists but is not super admin
                // Check if another super admin exists
                if ($existingSuperAdmin && $existingSuperAdmin->id !== $superAdmin->id) {
                    $this->command->warn('Another super admin already exists. Cannot upgrade this user.');
                    return;
                }
                // Upgrade to super admin
                $superAdmin->update([
                    'name' => 'Shushilknp',
                    'password' => Hash::make('Shushil3141592'),
                    'role' => 'super_admin',
                    'is_verified' => true,
                    'email_verified_at' => now(),
                ]);
                $this->command->info('User upgraded to super admin successfully!');
            }
        }
    }
}

