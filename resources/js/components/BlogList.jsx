import React from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function BlogList() {
  const [posts, setPosts] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [tag, setTag] = React.useState('');

  const fetchPosts = async (params = {}) => {
    setLoading(true);
    try {
      const res = await blogAPI.list(params);
      const payload = res.data;
      if (Array.isArray(payload)) {
        setPosts(payload);
        setMeta(null);
      } else {
        setPosts(payload.data || []);
        setMeta(payload);
      }
    } catch (e) {
      console.error('Failed to load blog posts', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts({
      q: search || undefined,
      category: category || undefined,
      tag: tag || undefined,
    });
  };

  const handlePage = (url) => {
    if (!url) return;
    const params = new URL(url, window.location.origin);
    const page = params.searchParams.get('page') || 1;
    fetchPosts({ q: search || undefined, page });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Blog</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input
            placeholder="Search posts..."
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
          <Input
            placeholder="Tag slug"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-36"
          />
          <Button type="submit">Filter</Button>
        </form>
      </div>

      {loading && <p className="mb-4">Loading...</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {(posts || []).map((post) => (
          <Card key={post.id} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                <Link to={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </CardTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Unpublished'}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {post.summary || 'No summary provided.'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && posts?.length === 0 && <p className="mt-4 text-[hsl(var(--muted-foreground))]">No posts found.</p>}

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
