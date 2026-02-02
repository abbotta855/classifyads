import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
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
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Post Discussion topic:</h1>
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
      <Card className="bg-red-50 dark:bg-red-950/50 border-2 border-red-500 dark:border-red-700 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-red-700 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900 dark:text-red-100 mb-1">Community Rules</h3>
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                User can post discussion topic or ask question related to our website, posted product, service but they have to follow online community rules ask question or reply answer.
              </p>
            </div>
          </div>
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
        <Card className="bg-orange-50 dark:bg-orange-950/50 border border-orange-400 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-orange-700 dark:text-orange-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                Registered user can post topic and reply answer on posted topic, so need to{' '}
                <Link to="/login" className="font-semibold underline hover:no-underline text-blue-600 dark:text-blue-400">
                  login
                </Link>
                {' '}to post.
              </p>
            </div>
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
    </Layout>
  );
}
