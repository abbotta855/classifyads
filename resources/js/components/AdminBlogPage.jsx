import React from 'react';
import { Link } from 'react-router-dom';
import { blogAdminAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

function QuickAddCategory({ onAdd }) {
  const [name, setName] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await blogAdminAPI.createCategory(name.trim());
      onAdd(res.data);
      setName('');
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="flex gap-1 shrink-0">
      <Input placeholder="+ Category" value={name} onChange={(e) => setName(e.target.value)} className="w-24" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())} />
      <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={adding || !name.trim()}>+</Button>
    </div>
  );
}

function QuickAddTag({ onAdd }) {
  const [name, setName] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await blogAdminAPI.createTag(name.trim());
      onAdd(res.data);
      setName('');
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="flex gap-2 items-center">
      <Input placeholder="Add tag..." value={name} onChange={(e) => setName(e.target.value)} className="w-32" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())} />
      <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={adding || !name.trim()}>Add tag</Button>
    </div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [tags, setTags] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [publishedFilter, setPublishedFilter] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [formData, setFormData] = React.useState({
    title: '',
    excerpt: '',
    content: '',
    blog_category_id: '',
    tag_ids: [],
    is_published: false,
  });
  const [featuredImage, setFeaturedImage] = React.useState(null);

  const fetchPosts = async (params = {}) => {
    setLoading(true);
    try {
      const query = { q: params.q ?? search, published: params.published ?? publishedFilter, page: params.page };
      const res = await blogAdminAPI.list(query);
      const payload = res.data;
      setPosts(payload.data || payload || []);
      setMeta(payload);
    } catch (e) {
      console.error('Failed to load posts', e);
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await blogAdminAPI.categories();
      setCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await blogAdminAPI.tags();
      setTags(res.data || []);
    } catch (e) {
      console.error('Failed to load tags', e);
    }
  };

  React.useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  React.useEffect(() => {
    fetchPosts({ q: search || undefined, published: publishedFilter || undefined });
  }, [search, publishedFilter]);

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      blog_category_id: '',
      tag_ids: [],
      is_published: false,
    });
    setFeaturedImage(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (post) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      blog_category_id: post.blog_category_id?.toString() || '',
      tag_ids: (post.tags || []).map((t) => t.id),
      is_published: !!post.is_published,
    });
    setFeaturedImage(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const isFormData = featuredImage || (editingId && featuredImage);
      const payload = isFormData
        ? (() => {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('content', formData.content);
            fd.append('excerpt', formData.excerpt);
            fd.append('is_published', formData.is_published ? '1' : '0');
            if (formData.blog_category_id) fd.append('blog_category_id', formData.blog_category_id);
            (formData.tag_ids || []).forEach((id) => fd.append('tag_ids[]', id));
            if (featuredImage) fd.append('featured_image', featuredImage);
            return fd;
          })()
        : {
            ...formData,
            blog_category_id: formData.blog_category_id || null,
            tag_ids: formData.tag_ids || [],
          };

      if (editingId) {
        await blogAdminAPI.update(editingId, payload);
        setSuccess('Post updated.');
      } else {
        await blogAdminAPI.create(payload);
        setSuccess('Post created.');
      }
      resetForm();
      fetchPosts({ q: search || undefined, published: publishedFilter || undefined });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await blogAdminAPI.remove(id);
      setSuccess('Post deleted.');
      fetchPosts({ q: search || undefined, published: publishedFilter || undefined });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const toggleTag = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids?.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...(prev.tag_ids || []), tagId],
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Blog Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          {showForm ? 'Cancel' : 'New Post'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-sm">{success}</div>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Post' : 'Create New Post'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt (summary)</label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short summary"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Full post content (HTML supported)"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={formData.blog_category_id}
                    onChange={(e) => setFormData({ ...formData, blog_category_id: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <QuickAddCategory onAdd={(c) => { setCategories((prev) => [...prev, c]); setFormData((f) => ({ ...f, blog_category_id: c.id.toString() })); }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t) => (
                    <label key={t.id} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tag_ids?.includes(t.id)}
                        onChange={() => toggleTag(t.id)}
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  ))}
                </div>
                <QuickAddTag onAdd={(t) => setTags((prev) => [...prev, t])} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Featured Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFeaturedImage(e.target.files[0] || null)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <span>Published</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : (
        <div className="space-y-4">
          {(posts || []).map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">
                    <Link to={`/blog/${post.slug}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    {post.is_published ? (
                      <span className="text-green-600">Published</span>
                    ) : (
                      <span className="text-amber-600">Draft</span>
                    )}
                    {' · '}
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                    {post.category && ` · ${post.category.name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} className="text-red-600">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!posts || posts.length === 0) && !loading && (
            <p className="text-[hsl(var(--muted-foreground))]">No posts yet. Create one above.</p>
          )}
        </div>
      )}

      {meta && (meta.prev_page_url || meta.next_page_url) && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => fetchPosts({ q: search || undefined, published: publishedFilter || undefined, page: meta.current_page - 1 })}
            disabled={!meta.prev_page_url}
          >
            Previous
          </Button>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            onClick={() => fetchPosts({ q: search || undefined, published: publishedFilter || undefined, page: meta.current_page + 1 })}
            disabled={!meta.next_page_url}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
