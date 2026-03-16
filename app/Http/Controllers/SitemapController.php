<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Auction;
use App\Models\Ebook;
use App\Models\NepaliProduct;
use App\Models\ForumThread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class SitemapController extends Controller
{
    /**
     * Generate sitemap.xml
     */
    public function index()
    {
        $baseUrl = config('app.url');
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Homepage
        $xml .= $this->urlElement($baseUrl, now(), 'daily', '1.0');

        // Ads
        $ads = Ad::where('status', 'approved')->get();
        foreach ($ads as $ad) {
            $xml .= $this->urlElement(
                $baseUrl . '/ads/' . $ad->slug,
                $ad->updated_at,
                'weekly',
                '0.8'
            );
        }

        // Auctions
        $auctions = Auction::whereIn('status', ['pending', 'active'])->get();
        foreach ($auctions as $auction) {
            $xml .= $this->urlElement(
                $baseUrl . '/auctions/' . $auction->id,
                $auction->updated_at,
                'daily',
                '0.9'
            );
        }

        // eBooks
        $ebooks = Ebook::where('status', 'approved')->get();
        foreach ($ebooks as $ebook) {
            $xml .= $this->urlElement(
                $baseUrl . '/ebooks/' . $ebook->id,
                $ebook->updated_at,
                'monthly',
                '0.7'
            );
        }

        // Nepali Products
        $products = NepaliProduct::where('status', 'approved')->get();
        foreach ($products as $product) {
            $xml .= $this->urlElement(
                $baseUrl . '/nepali-products/' . ($product->slug ?? $product->id),
                $product->updated_at,
                'weekly',
                '0.8'
            );
        }

        // Forum Threads
        $threads = ForumThread::where('is_locked', false)->get();
        foreach ($threads as $thread) {
            $xml .= $this->urlElement(
                $baseUrl . '/forum/' . $thread->slug,
                $thread->updated_at,
                'daily',
                '0.7'
            );
        }

        $xml .= '</urlset>';

        return Response::make($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    private function urlElement($url, $lastmod, $changefreq, $priority)
    {
        return "  <url>\n" .
               "    <loc>" . htmlspecialchars($url) . "</loc>\n" .
               "    <lastmod>" . $lastmod->format('Y-m-d') . "</lastmod>\n" .
               "    <changefreq>" . $changefreq . "</changefreq>\n" .
               "    <priority>" . $priority . "</priority>\n" .
               "  </url>\n";
    }
}

