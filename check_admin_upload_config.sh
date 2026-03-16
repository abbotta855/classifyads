#!/bin/bash

echo "=========================================="
echo "Checking Admin Panel Upload Configuration"
echo "=========================================="
echo ""

# Check PHP-FPM settings
echo "1. PHP-FPM Upload Settings:"
echo "-------------------------------------------"
echo "upload_max_filesize: $(grep '^upload_max_filesize' /etc/php/8.3/fpm/php.ini | grep -v '^;' | cut -d'=' -f2 | tr -d ' ')"
echo "post_max_size: $(grep '^post_max_size' /etc/php/8.3/fpm/php.ini | grep -v '^;' | cut -d'=' -f2 | tr -d ' ')"
echo "max_file_uploads: $(grep '^max_file_uploads' /etc/php/8.3/fpm/php.ini | grep -v '^;' | cut -d'=' -f2 | tr -d ' ')"
echo ""

# Check Nginx settings
echo "2. Nginx Upload Settings:"
echo "-------------------------------------------"
echo "client_max_body_size:"
grep "client_max_body_size" /etc/nginx/sites-available/default /etc/nginx/nginx.conf 2>/dev/null | grep -v "^#" | head -2
echo ""

# Check PHP block
echo "3. PHP Block Status:"
echo "-------------------------------------------"
if grep -q "^[[:space:]]*location ~ \\\.php\$" /etc/nginx/sites-available/default; then
    echo "✅ PHP block is ACTIVE"
    echo "FastCGI buffers:"
    grep "fastcgi_buffer" /etc/nginx/sites-available/default | head -4
else
    echo "❌ PHP block is COMMENTED or MISSING"
fi
echo ""

# Check actual PHP runtime values
echo "4. PHP Runtime Values:"
echo "-------------------------------------------"
php -r "echo 'upload_max_filesize: ' . ini_get('upload_max_filesize') . PHP_EOL;"
php -r "echo 'post_max_size: ' . ini_get('post_max_size') . PHP_EOL;"
php -r "echo 'max_file_uploads: ' . ini_get('max_file_uploads') . PHP_EOL;"
echo ""

echo "=========================================="
echo "Recommendations:"
echo "=========================================="
echo "For 4 images at 2MB each (8MB total):"
echo "- post_max_size should be at least 20M"
echo "- upload_max_filesize should be at least 10M"
echo "- client_max_body_size should be at least 20M"
echo "- max_file_uploads should be at least 4"
echo ""
echo "If values are too low, run:"
echo "  sudo sed -i 's/^;*post_max_size = .*/post_max_size = 20M/' /etc/php/8.3/fpm/php.ini"
echo "  sudo sed -i 's/^;*upload_max_filesize = .*/upload_max_filesize = 10M/' /etc/php/8.3/fpm/php.ini"
echo "  sudo systemctl restart php8.3-fpm"
echo "  sudo systemctl restart nginx"
echo "=========================================="

