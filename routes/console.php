<?php

use App\Console\Commands\BackfillNepaliTranslations;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Ensure custom maintenance commands are available in artisan.
Artisan::starting(function ($artisan) {
    $artisan->resolve(BackfillNepaliTranslations::class);
});
