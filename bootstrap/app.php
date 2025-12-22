<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withSchedule(function ($schedule) {
        // Activate pending auctions when their start time arrives (every minute)
        $schedule->command('auctions:activate-pending')->everyMinute();
        // Check for ended auctions every minute
        $schedule->command('auctions:check-ended')->everyMinute();
        // Notify about auctions ending soon every 15 minutes
        $schedule->command('auctions:notify-ending-soon')->everyFifteenMinutes();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
