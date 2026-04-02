import React from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../utils/translation';

export default function BlogList() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">{t('blog.title')}</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/my-blog">
                  <Button variant="outline">{t('blog.myPosts')}</Button>
                </Link>
                <Link to="/my-blog/new">
                  <Button>{t('blog.writePost')}</Button>
                </Link>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline">{t('blog.loginToWrite')}</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 gap-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 w-full">
            <Input
              placeholder={t('blog.searchPosts')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder={t('blog.categorySlug')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder={t('blog.tagSlug')}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-36"
            />
            <Button type="submit">{t('blog.filter')}</Button>
          </form>
        </div>

        {loading && <p className="mb-4">{t('common.loading')}</p>}

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
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : t('blog.unpublished')}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {post.summary || t('blog.noSummary')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && posts?.length === 0 && <p className="mt-4 text-[hsl(var(--muted-foreground))]">{t('blog.noPostsFound')}</p>}

        {meta && (meta.prev_page_url || meta.next_page_url) && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => handlePage(meta.prev_page_url)}
              disabled={!meta.prev_page_url}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('blog.pageOf', { current: meta.current_page, last: meta.last_page })}
            </span>
            <Button onClick={() => handlePage(meta.next_page_url)} disabled={!meta.next_page_url}>
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
