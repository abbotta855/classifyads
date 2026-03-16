<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Auction;
use App\Models\Ebook;
use App\Models\NepaliProduct;
use App\Models\ForumThread;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Unified search across all content types
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $type = $request->get('type', 'all'); // all, ads, auctions, ebooks, products, forum
        $categoryId = $request->get('category_id');
        $locationId = $request->get('location_id');
        $minPrice = $request->get('min_price');
        $maxPrice = $request->get('max_price');
        $limit = $request->get('limit', 20);

        $results = [
            'ads' => [],
            'auctions' => [],
            'ebooks' => [],
            'products' => [],
            'forum_threads' => [],
        ];

        // Search Ads
        if ($type === 'all' || $type === 'ads') {
            $adsQuery = Ad::with(['user', 'category', 'photos'])
                ->where('status', 'approved');
            
            if ($query) {
                $adsQuery->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });
            }
            
            if ($categoryId) {
                $adsQuery->where('category_id', $categoryId);
            }
            
            if ($locationId) {
                $adsQuery->where('location_id', $locationId);
            }
            
            if ($minPrice !== null) {
                $adsQuery->where('price', '>=', $minPrice);
            }
            
            if ($maxPrice !== null) {
                $adsQuery->where('price', '<=', $maxPrice);
            }
            
            $results['ads'] = $adsQuery->limit($limit)->get()->map(function($ad) {
                return [
                    'id' => $ad->id,
                    'title' => $ad->title,
                    'slug' => $ad->slug,
                    'price' => $ad->price,
                    'image' => $ad->photos->first()?->photo_url ?? $ad->image1_url,
                    'type' => 'ad',
                    'url' => "/ads/{$ad->slug}",
                ];
            });
        }

        // Search Auctions
        if ($type === 'all' || $type === 'auctions') {
            $auctionsQuery = Auction::with(['ad', 'ad.photos'])
                ->where('status', 'active');
            
            if ($query) {
                $auctionsQuery->whereHas('ad', function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });
            }
            
            if ($categoryId) {
                $auctionsQuery->whereHas('ad', function($q) use ($categoryId) {
                    $q->where('category_id', $categoryId);
                });
            }
            
            $results['auctions'] = $auctionsQuery->limit($limit)->get()->map(function($auction) {
                return [
                    'id' => $auction->id,
                    'title' => $auction->ad->title ?? 'Auction',
                    'current_bid' => $auction->current_bid_price,
                    'image' => $auction->ad->photos->first()?->photo_url ?? $auction->ad->image1_url,
                    'type' => 'auction',
                    'url' => "/auctions/{$auction->id}",
                ];
            });
        }

        // Search eBooks
        if ($type === 'all' || $type === 'ebooks') {
            $ebooksQuery = Ebook::with(['user', 'category'])
                ->where('status', 'approved');
            
            if ($query) {
                $ebooksQuery->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });
            }
            
            if ($categoryId) {
                $ebooksQuery->where('category_id', $categoryId);
            }
            
            if ($minPrice !== null) {
                $ebooksQuery->where('price', '>=', $minPrice);
            }
            
            if ($maxPrice !== null) {
                $ebooksQuery->where('price', '<=', $maxPrice);
            }
            
            $results['ebooks'] = $ebooksQuery->limit($limit)->get()->map(function($ebook) {
                return [
                    'id' => $ebook->id,
                    'title' => $ebook->title,
                    'price' => $ebook->price,
                    'image' => $ebook->cover_image,
                    'type' => 'ebook',
                    'url' => "/ebooks/{$ebook->id}",
                ];
            });
        }

        // Search Nepali Products
        if ($type === 'all' || $type === 'products') {
            $productsQuery = NepaliProduct::with(['user', 'category', 'images'])
                ->where('status', 'approved');
            
            if ($query) {
                $productsQuery->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });
            }
            
            if ($categoryId) {
                $productsQuery->where('category_id', $categoryId);
            }
            
            if ($minPrice !== null) {
                $productsQuery->where('retail_price', '>=', $minPrice);
            }
            
            if ($maxPrice !== null) {
                $productsQuery->where('retail_price', '<=', $maxPrice);
            }
            
            $results['products'] = $productsQuery->limit($limit)->get()->map(function($product) {
                return [
                    'id' => $product->id,
                    'title' => $product->title,
                    'price' => $product->retail_price,
                    'image' => $product->primary_image ?? $product->images->first()?->image_url,
                    'type' => 'product',
                    'url' => "/nepali-products/" . ($product->slug ?? $product->id),
                ];
            });
        }

        // Search Forum Threads
        if ($type === 'all' || $type === 'forum') {
            $threadsQuery = ForumThread::with(['author', 'category'])
                ->where('is_locked', false);
            
            if ($query) {
                $threadsQuery->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('content', 'like', "%{$query}%");
                });
            }
            
            if ($categoryId) {
                $threadsQuery->where('forum_category_id', $categoryId);
            }
            
            $results['forum_threads'] = $threadsQuery->limit($limit)->get()->map(function($thread) {
                return [
                    'id' => $thread->id,
                    'title' => $thread->title,
                    'slug' => $thread->slug,
                    'replies' => $thread->post_count,
                    'views' => $thread->views,
                    'type' => 'forum',
                    'url' => "/forum/{$thread->slug}",
                ];
            });
        }

        $total = array_sum(array_map('count', $results));

        return response()->json([
            'query' => $query,
            'total' => $total,
            'results' => $results,
        ]);
    }

    /**
     * Autocomplete suggestions
     */
    public function autocomplete(Request $request)
    {
        $query = $request->get('q', '');
        $limit = $request->get('limit', 10);

        if (strlen($query) < 2) {
            return response()->json(['suggestions' => []]);
        }

        $suggestions = [];

        // Get ad titles
        $ads = Ad::where('status', 'approved')
            ->where('title', 'like', "%{$query}%")
            ->limit($limit)
            ->pluck('title')
            ->map(fn($title) => ['text' => $title, 'type' => 'ad']);

        // Get auction titles
        $auctions = Auction::where('status', 'active')
            ->whereHas('ad', function($q) use ($query) {
                $q->where('title', 'like', "%{$query}%");
            })
            ->with('ad')
            ->limit($limit)
            ->get()
            ->map(fn($auction) => ['text' => $auction->ad->title ?? 'Auction', 'type' => 'auction']);

        // Get ebook titles
        $ebooks = Ebook::where('status', 'approved')
            ->where('title', 'like', "%{$query}%")
            ->limit($limit)
            ->pluck('title')
            ->map(fn($title) => ['text' => $title, 'type' => 'ebook']);

        // Get product titles
        $products = NepaliProduct::where('status', 'approved')
            ->where('title', 'like', "%{$query}%")
            ->limit($limit)
            ->pluck('title')
            ->map(fn($title) => ['text' => $title, 'type' => 'product']);

        // Get forum thread titles
        $threads = ForumThread::where('is_locked', false)
            ->where('title', 'like', "%{$query}%")
            ->limit($limit)
            ->pluck('title')
            ->map(fn($title) => ['text' => $title, 'type' => 'forum']);

        $suggestions = collect([$ads, $auctions, $ebooks, $products, $threads])
            ->flatten(1)
            ->unique('text')
            ->take($limit)
            ->values()
            ->toArray();

        return response()->json(['suggestions' => $suggestions]);
    }
}
