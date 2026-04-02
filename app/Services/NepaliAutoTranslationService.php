<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class NepaliAutoTranslationService
{
    /**
     * Translate English (or other non-Devanagari) text to Nepali.
     * Returns original text on failure so content always remains usable.
     */
    public function translateToNepali(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        $trimmed = trim($text);
        if ($trimmed === '') {
            return $text;
        }

        // If already contains Devanagari characters, keep as-is.
        if (preg_match('/\p{Devanagari}/u', $trimmed)) {
            return $text;
        }

        $cacheKey = 'ne_auto_translation:' . md5($trimmed);

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($trimmed, $text) {
            try {
                $response = Http::timeout(8)->get('https://translate.googleapis.com/translate_a/single', [
                    'client' => 'gtx',
                    'sl' => 'auto',
                    'tl' => 'ne',
                    'dt' => 't',
                    'q' => $trimmed,
                ]);

                if (!$response->successful()) {
                    return $text;
                }

                $payload = $response->json();
                if (!is_array($payload) || !isset($payload[0]) || !is_array($payload[0])) {
                    return $text;
                }

                $translatedParts = [];
                foreach ($payload[0] as $segment) {
                    if (is_array($segment) && isset($segment[0]) && is_string($segment[0])) {
                        $translatedParts[] = $segment[0];
                    }
                }

                $translated = trim(implode('', $translatedParts));
                return $translated !== '' ? $translated : $text;
            } catch (\Throwable $e) {
                return $text;
            }
        });
    }
}

