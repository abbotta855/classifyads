<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-super 
                            {--email= : Email address for the super admin}
                            {--name= : Name for the super admin}
                            {--password= : Password for the super admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or update a super admin user (only 1 super admin allowed)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        $name = $this->option('name');
        $password = $this->option('password');

        // If no options provided, prompt interactively
        if (!$email) {
            $email = $this->ask('Enter email address for super admin');
        }

        if (!$name) {
            $name = $this->ask('Enter name for super admin', 'Super Admin');
        }

        if (!$password) {
            $password = $this->secret('Enter password for super admin (min 8 characters)');
            $passwordConfirm = $this->secret('Confirm password');
            
            if ($password !== $passwordConfirm) {
                $this->error('Passwords do not match!');
                return 1;
            }
            
            if (strlen($password) < 8) {
                $this->error('Password must be at least 8 characters!');
                return 1;
            }
        }

        // IMPORTANT: Check if super admin already exists
        $existingSuperAdmin = User::where('role', 'super_admin')->first();

        // Check if target user exists
        $user = User::where('email', $email)->first();

        if ($user) {
            // If user exists and is already super admin, just update
            if ($user->role === 'super_admin') {
                $user->update([
                    'name' => $name,
                    'password' => Hash::make($password),
                    'is_verified' => true,
                    'email_verified_at' => now(),
                ]);

                $this->info("✅ Super admin updated successfully!");
                $this->info("Email: {$email}");
                $this->info("Name: {$name}");
                return 0;
            }

            // If user exists but is NOT super admin
            // Check if another super admin already exists
            if ($existingSuperAdmin && $existingSuperAdmin->id !== $user->id) {
                $this->error("❌ Cannot create super admin: Another super admin already exists!");
                $this->error("Existing super admin: {$existingSuperAdmin->email}");
                $this->warn("Only 1 super admin is allowed in the system.");
                return 1;
            }

            // Upgrade existing user to super admin
            $user->update([
                'name' => $name,
                'password' => Hash::make($password),
                'role' => 'super_admin',
                'is_verified' => true,
                'email_verified_at' => now(),
            ]);

            $this->info("✅ User upgraded to super admin successfully!");
            $this->info("Email: {$email}");
            $this->info("Name: {$name}");
            return 0;
        }

        // User doesn't exist - check if super admin already exists
        if ($existingSuperAdmin) {
            $this->error("❌ Cannot create super admin: A super admin already exists!");
            $this->error("Existing super admin: {$existingSuperAdmin->email}");
            $this->warn("Only 1 super admin is allowed in the system.");
            $this->warn("If you want to change the super admin, first remove the existing one.");
            return 1;
        }

        // Create new super admin (no existing super admin)
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'super_admin',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        $this->info("✅ Super admin created successfully!");
        $this->info("Email: {$email}");
        $this->info("Name: {$name}");
        return 0;
    }
}
