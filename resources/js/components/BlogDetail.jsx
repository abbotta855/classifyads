import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await blogAPI.detail(slug);
        setPost(res.data);
        if (res.data?.title) {
          document.title = res.data.title;
        }
        if (res.data?.summary) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', res.data.summary);
          } else {
            const m = document.createElement('meta');
            m.name = 'description';
            m.content = res.data.summary;
            document.head.appendChild(m);
          }
        }
      } catch (e) {
        console.error('Failed to load post', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!post) return <div className="p-6 text-center">Post not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/blog" className="text-sm text-blue-600 hover:underline">
        ← Back to Blog
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-2xl">{post.title}</CardTitle>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Unpublished'}
          </p>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag) => (
                <span key={tag.id} className="px-2 py-1 text-xs rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {post.hero_image && (
            <img src={post.hero_image} alt={post.title} className="w-full rounded" />
          )}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || '<p>No content.</p>' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
