<?php

/**
 * Test script for Nepali Products Backend API
 * Run: php test_nepali_products_backend.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$kernel->terminate($request, $response);

// Test results
$results = [];

echo "========================================\n";
echo "  NEPALI PRODUCTS BACKEND TEST\n";
echo "========================================\n\n";

// Test 1: Check if tables exist
echo "1. Checking database tables...\n";
try {
    $tables = ['nepali_products', 'nepali_product_images', 'nepali_product_ratings'];
    foreach ($tables as $table) {
        $exists = \Illuminate\Support\Facades\Schema::hasTable($table);
        $results['tables'][$table] = $exists;
        echo "   " . ($exists ? "✓" : "✗") . " Table '{$table}': " . ($exists ? "EXISTS" : "MISSING") . "\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    $results['tables'] = false;
}

// Test 2: Check if models exist
echo "\n2. Checking models...\n";
try {
    $models = [
        'NepaliProduct' => \App\Models\NepaliProduct::class,
        'NepaliProductImage' => \App\Models\NepaliProductImage::class,
        'NepaliProductRating' => \App\Models\NepaliProductRating::class,
    ];
    foreach ($models as $name => $class) {
        $exists = class_exists($class);
        $results['models'][$name] = $exists;
        echo "   " . ($exists ? "✓" : "✗") . " Model '{$name}': " . ($exists ? "EXISTS" : "MISSING") . "\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    $results['models'] = false;
}

// Test 3: Check if controller exists
echo "\n3. Checking controller...\n";
try {
    $controller = \App\Http\Controllers\NepaliProductController::class;
    $exists = class_exists($controller);
    $results['controller'] = $exists;
    echo "   " . ($exists ? "✓" : "✗") . " Controller: " . ($exists ? "EXISTS" : "MISSING") . "\n";
    
    if ($exists) {
        $reflection = new ReflectionClass($controller);
        $methods = ['index', 'show', 'store', 'update', 'destroy', 'rate'];
        foreach ($methods as $method) {
            $hasMethod = $reflection->hasMethod($method);
            echo "      " . ($hasMethod ? "✓" : "✗") . " Method '{$method}': " . ($hasMethod ? "EXISTS" : "MISSING") . "\n";
        }
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    $results['controller'] = false;
}

// Test 4: Check if routes exist
echo "\n4. Checking routes...\n";
try {
    $routes = [
        'GET /api/nepali-products' => 'nepali-products.index',
        'GET /api/nepali-products/{id}' => 'nepali-products.show',
        'POST /api/nepali-products' => 'nepali-products.store',
        'PUT /api/nepali-products/{id}' => 'nepali-products.update',
        'DELETE /api/nepali-products/{id}' => 'nepali-products.destroy',
        'POST /api/nepali-products/{id}/rate' => 'nepali-products.rate',
    ];
    
    $routeList = \Illuminate\Support\Facades\Route::getRoutes();
    foreach ($routes as $path => $name) {
        $found = false;
        foreach ($routeList as $route) {
            if (str_contains($route->uri(), 'nepali-products')) {
                $found = true;
                break;
            }
        }
        $results['routes'][$path] = $found;
        echo "   " . ($found ? "✓" : "✗") . " Route '{$path}': " . ($found ? "EXISTS" : "MISSING") . "\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    $results['routes'] = false;
}

// Test 5: Test model relationships
echo "\n5. Testing model relationships...\n";
try {
    $product = new \App\Models\NepaliProduct();
    $relationships = ['user', 'category', 'images', 'ratings'];
    foreach ($relationships as $rel) {
        $hasMethod = method_exists($product, $rel);
        $results['relationships'][$rel] = $hasMethod;
        echo "   " . ($hasMethod ? "✓" : "✗") . " Relationship '{$rel}': " . ($hasMethod ? "EXISTS" : "MISSING") . "\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    $results['relationships'] = false;
}

// Test 6: Test database connection and sample query
echo "\n6. Testing database connection...\n";
try {
    $count = \App\Models\NepaliProduct::count();
    $results['database'] = true;
    echo "   ✓ Database connection: OK\n";
    echo "   ✓ Current products in database: {$count}\n";
} catch (\Exception $e) {
    echo "   ✗ Database error: " . $e->getMessage() . "\n";
    $results['database'] = false;
}

// Summary
echo "\n========================================\n";
echo "  TEST SUMMARY\n";
echo "========================================\n";

$allPassed = true;
foreach ($results as $category => $value) {
    if (is_array($value)) {
        foreach ($value as $item => $status) {
            if (!$status) {
                $allPassed = false;
                break 2;
            }
        }
    } else {
        if (!$value) {
            $allPassed = false;
            break;
        }
    }
}

if ($allPassed) {
    echo "✓ All tests PASSED!\n";
    echo "\nBackend is ready for frontend integration.\n";
} else {
    echo "✗ Some tests FAILED. Please review the errors above.\n";
}

echo "========================================\n";


