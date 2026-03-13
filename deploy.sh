#!/bin/bash

# Deployment script for Laravel + Vite project
# This script handles git pull, dependencies, and build process

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Navigate to project directory (adjust path if needed)
cd /var/www/myapp/ads-classify-project || exit

echo "📦 Step 1: Handling local changes..."

# Stash or discard local changes to package-lock.json (it will be regenerated)
if git diff --quiet package-lock.json; then
    echo "   ✓ No local changes to package-lock.json"
else
    echo "   ⚠️  Local changes detected in package-lock.json"
    echo "   📝 Stashing local changes..."
    git stash push -m "Stash package-lock.json before deployment $(date +%Y-%m-%d_%H-%M-%S)" package-lock.json || {
        echo "   ⚠️  Stash failed, discarding local changes instead..."
        git checkout -- package-lock.json
    }
fi

echo "📥 Step 2: Pulling latest changes from repository..."
git pull origin main

echo "📚 Step 3: Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "📦 Step 4: Installing Node dependencies..."
npm ci  # Use 'ci' instead of 'install' for consistent builds

echo "🔨 Step 5: Building frontend assets..."
npm run build

echo "🗄️  Step 6: Running database migrations..."
php artisan migrate --force

echo "🧹 Step 7: Clearing and optimizing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps (if needed):"
echo "   - Restart your web server (nginx/apache)"
echo "   - Restart queue workers: php artisan queue:restart"
echo "   - Check logs: tail -f storage/logs/laravel.log"















