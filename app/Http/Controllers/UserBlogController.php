<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserBlogController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $query = BlogPost::with(['category', 'tags'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qry) use ($q) {
                $qry->where('title', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%")
                    ->orWhere('excerpt', 'like', "%{$q}%");
            });
        }

        if ($request->filled('published')) {
            if ($request->published === '1') {
                $query->where('is_published', true);
            } elseif ($request->published === '0') {
                $query->where('is_published', false);
            }
        }

        return response()->json($query->paginate(12));
    }

    public function show(Request $request, int $id)
    {
        $post = BlogPost::with(['category', 'tags'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($post);
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
            'featured_image' => 'nullable|image|max:5120',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        $slug = $this->ensureUniqueSlug($slug);

        $featuredImageUrl = null;
        if ($request->hasFile('featured_image')) {
            $path = $request->file('featured_image')->store('blog', 'public');
            $featuredImageUrl = '/storage/' . $path;
        }

        // Users cannot directly publish; requires admin approval
        $post = BlogPost::create([
            'user_id' => $request->user()->id,
            'blog_category_id' => $validated['blog_category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'],
            'featured_image_url' => $featuredImageUrl,
            'is_published' => false,
            'published_at' => null,
        ]);

        if (!empty($validated['tag_ids'])) {
            $post->tags()->sync($validated['tag_ids']);
        }

        $post->load(['category', 'tags']);
        return response()->json($post, 201);
    }

    public function update(Request $request, int $id)
    {
        $post = BlogPost::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug,' . $id,
            'excerpt' => 'nullable|string|max:1000',
            'content' => 'sometimes|required|string',
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:blog_tags,id',
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

        // Any edit by user unpublishes the post and requires admin to republish
        $validated['is_published'] = false;
        $validated['published_at'] = null;

        $updateData = collect($validated)->except(['tag_ids', 'featured_image'])->all();
        $post->update($updateData);

        if (array_key_exists('tag_ids', $validated)) {
            $post->tags()->sync($validated['tag_ids'] ?? []);
        }

        $post->load(['category', 'tags']);
        return response()->json($post);
    }

    public function destroy(Request $request, int $id)
    {
        $post = BlogPost::where('user_id', $request->user()->id)->findOrFail($id);

        if ($post->featured_image_url) {
            $oldPath = str_replace('/storage/', '', $post->featured_image_url);
            Storage::disk('public')->delete($oldPath);
        }
        $post->delete();

        return response()->json(['message' => 'Post deleted'], 200);
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

