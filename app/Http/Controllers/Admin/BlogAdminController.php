<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class BlogAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::with(['category', 'tags', 'user'])->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qry) use ($q) {
                $qry->where('title', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%")
                    ->orWhere('excerpt', 'like', "%{$q}%");
            });
        }
        if ($request->filled('category')) {
            $query->whereHas('category', fn ($c) => $c->where('slug', $request->category));
        }
        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($t) => $t->where('slug', $request->tag));
        }
        if ($request->filled('published')) {
            if ($request->published === '1') {
                $query->where('is_published', true);
            } elseif ($request->published === '0') {
                $query->where('is_published', false);
            }
        }

        $posts = $query->paginate(20);
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug',
            'excerpt' => 'nullable|string|max:1000',
            'content' => 'required|string',
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:blog_tags,id',
            'is_published' => 'boolean',
            'featured_image' => 'nullable|image|max:5120',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        $slug = $this->ensureUniqueSlug($slug);

        $featuredImageUrl = null;
        if ($request->hasFile('featured_image')) {
            $path = $request->file('featured_image')->store('blog', 'public');
            $featuredImageUrl = '/storage/' . $path;
        }

        $post = BlogPost::create([
            'user_id' => auth()->id(),
            'blog_category_id' => $validated['blog_category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'],
            'featured_image_url' => $featuredImageUrl,
            'is_published' => $validated['is_published'] ?? false,
            'published_at' => ($validated['is_published'] ?? false) ? now() : null,
        ]);

        if (!empty($validated['tag_ids'])) {
            $post->tags()->sync($validated['tag_ids']);
        }

        $post->load(['category', 'tags', 'user']);
        return response()->json($post, 201);
    }

    public function update(Request $request, $id)
    {
        $post = BlogPost::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug,' . $id,
            'excerpt' => 'nullable|string|max:1000',
            'content' => 'sometimes|required|string',
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:blog_tags,id',
            'is_published' => 'boolean',
            'featured_image' => 'nullable|image|max:5120',
        ]);

        if (isset($validated['slug'])) {
            $validated['slug'] = $this->ensureUniqueSlug($validated['slug'], $id);
        }
        if (isset($validated['title']) && empty($validated['slug'])) {
            $validated['slug'] = $this->ensureUniqueSlug(Str::slug($validated['title']), $id);
        }

        if ($request->hasFile('featured_image')) {
            if ($post->featured_image_url) {
                $oldPath = str_replace('/storage/', '', $post->featured_image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('featured_image')->store('blog', 'public');
            $validated['featured_image_url'] = '/storage/' . $path;
        }

        if (array_key_exists('is_published', $validated)) {
            $validated['published_at'] = $validated['is_published'] ? ($post->published_at ?? now()) : null;
        }

        $updateData = collect($validated)->except(['tag_ids', 'featured_image'])->all();
        $post->update($updateData);

        if (array_key_exists('tag_ids', $validated)) {
            $post->tags()->sync($validated['tag_ids'] ?? []);
        }

        $post->load(['category', 'tags', 'user']);
        return response()->json($post);
    }

    public function destroy($id)
    {
        $post = BlogPost::findOrFail($id);
        if ($post->featured_image_url) {
            $oldPath = str_replace('/storage/', '', $post->featured_image_url);
            Storage::disk('public')->delete($oldPath);
        }
        $post->delete();
        return response()->json(['message' => 'Post deleted'], 200);
    }

    public function categories()
    {
        return response()->json(BlogCategory::orderBy('name')->get());
    }

    public function tags()
    {
        return response()->json(BlogTag::orderBy('name')->get());
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $slug = Str::slug($validated['name']);
        $cat = BlogCategory::firstOrCreate(['slug' => $slug], ['name' => $validated['name'], 'is_active' => true]);
        return response()->json($cat, 201);
    }

    public function storeTag(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $slug = Str::slug($validated['name']);
        $tag = BlogTag::firstOrCreate(['slug' => $slug], ['name' => $validated['name']]);
        return response()->json($tag, 201);
    }

    private function ensureUniqueSlug(string $slug, ?int $excludeId = null): string
    {
        $base = $slug;
        $i = 0;
        while (true) {
            $q = BlogPost::where('slug', $slug);
            if ($excludeId) {
                $q->where('id', '!=', $excludeId);
            }
            if (!$q->exists()) {
                return $slug;
            }
            $slug = $base . '-' . (++$i);
        }
    }
}
