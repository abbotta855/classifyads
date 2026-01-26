import React from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './ui/UserAvatar';

export default function ForumList() {
  const [threads, setThreads] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [categories, setCategories] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { user } = useAuth();

  // Fetch categories on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await forumAPI.getCategories();
        setCategories(res.data || []);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  const fetchThreads = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await forumAPI.listThreads(params);
      const payload = res.data;
      if (Array.isArray(payload)) {
        setThreads(payload);
        setMeta(null);
      } else {
        setThreads(payload.data || []);
        setMeta(payload);
      }
    } catch (e) {
      console.error('Failed to load threads', e);
      setError('Failed to load threads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchThreads();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchThreads({
      q: search || undefined,
      category: category || undefined,
    });
  };

  const handlePage = (url) => {
    if (!url) return;
    const params = new URL(url, window.location.origin);
    const page = params.searchParams.get('page') || 1;
    fetchThreads({ q: search || undefined, category: category || undefined, page });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await forumAPI.createThread({ title, content, category_id: category || null });
      setTitle('');
      setContent('');
      setCategory('');
      fetchThreads();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create thread');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Community Forum</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={loading}>
            Filter
          </Button>
        </form>
      </div>

      {/* Community Rules Notice */}
      <Card className="bg-[hsl(var(--muted))]">
        <CardContent className="p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            <strong>Community Guidelines:</strong> Be respectful, stay on topic, and help others. 
            Spam, harassment, and off-topic posts may be removed.
          </p>
        </CardContent>
      </Card>

      {/* Create Thread Form */}
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start a thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}
            <Input
              placeholder="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
            <Textarea
              placeholder="What do you want to discuss?"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm flex-1"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Button onClick={handleCreate} disabled={!title.trim() || !content.trim() || creating}>
                {creating ? 'Posting...' : 'Post Thread'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
                Login
              </Link>
              {' '}to post a new thread and participate in discussions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">Loading threads...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Threads List */}
      {!loading && !error && (
        <div className="space-y-3">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-[hsl(var(--muted-foreground))]">No threads found.</p>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => (
              <Card key={thread.id} className={thread.is_pinned ? 'border-[hsl(var(--primary))] border-2' : ''}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      src={thread.author?.profile_picture}
                      name={thread.author?.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.is_pinned && (
                          <span className="text-xs bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-2 py-1 rounded">
                            Pinned
                          </span>
                        )}
                        {thread.category && (
                          <span className="text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-1 rounded">
                            {thread.category.name}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-1">
                        <Link to={`/forum/${thread.slug}`} className="hover:underline">
                          {thread.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                        <span>{thread.author?.name || 'User'}</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{thread.views || 0} views</span>
                        <span>•</span>
                        <span>{thread.post_count || 0} replies</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && (meta.prev_page_url || meta.next_page_url) && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => handlePage(meta.prev_page_url)}
            disabled={!meta.prev_page_url || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button 
            onClick={() => handlePage(meta.next_page_url)} 
            disabled={!meta.next_page_url || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
