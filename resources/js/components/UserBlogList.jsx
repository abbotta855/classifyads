import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogUserAPI } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export default function UserBlogList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blogUserAPI.list(q ? { q } : undefined);
      setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await blogUserAPI.remove(id);
    await load();
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Blog Posts</h1>
        <Link to="/my-blog/new">
          <Button>Create New</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search my posts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button onClick={load}>Search</Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-6">Loading...</CardContent></Card>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6">No posts yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{p.title}</h2>
                  <span className={`text-xs ${p.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                    {p.is_published ? 'Published' : 'Pending Review'}
                  </span>
                </div>
                {p.excerpt && <p className="text-sm text-[hsl(var(--muted-foreground))]">{p.excerpt}</p>}
                <div className="flex gap-2">
                  <Link to={`/my-blog/${p.id}/edit`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <Button variant="destructive" onClick={() => onDelete(p.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

