import React from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function ForumList() {
  const [threads, setThreads] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const { user } = useAuth();

  const fetchThreads = async (params = {}) => {
    setLoading(true);
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
    fetchThreads({ q: search || undefined, page });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await forumAPI.createThread({ title, content });
      setTitle('');
      setContent('');
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create thread');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Community Forum</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Category slug"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-40"
          />
          <Button type="submit">Filter</Button>
        </form>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start a thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="What do you want to discuss?"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>
              Post Thread
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && <p>Loading...</p>}

      <div className="space-y-3">
        {(threads || []).map((thread) => (
          <Card key={thread.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link to={`/forum/${thread.slug}`} className="hover:underline">
                  {thread.title}
                </Link>
              </CardTitle>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {thread.author?.name || 'User'} • {new Date(thread.created_at).toLocaleString()}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {!loading && threads?.length === 0 && (
        <p className="text-[hsl(var(--muted-foreground))]">No threads found.</p>
      )}

      {meta && (meta.prev_page_url || meta.next_page_url) && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => handlePage(meta.prev_page_url)}
            disabled={!meta.prev_page_url}
          >
            Previous
          </Button>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button onClick={() => handlePage(meta.next_page_url)} disabled={!meta.next_page_url}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
