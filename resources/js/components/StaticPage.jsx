import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function StaticPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get slug from URL path if not in params
  // Map common routes to slugs
  const getSlug = () => {
    if (slug) return slug;
    const path = location.pathname.replace('/', '');
    const routeMap = {
      'terms': 'terms',
      'faq': 'faq',
      'privacy': 'privacy-policy',
      'cookie-policy': 'cookie-policy',
      'about': 'about',
    };
    return routeMap[path] || path;
  };

  const pageSlug = getSlug();

  useEffect(() => {
    if (pageSlug) {
      loadPage();
    }
  }, [pageSlug]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/static-pages/${pageSlug}`);
      setPage(res.data);
    } catch (e) {
      console.error('Failed to load page:', e);
      setError('Page not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>{t('common.loading')}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !page) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error || 'Page not found'}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-[hsl(var(--foreground))] animate-fade-in">{page.title}</h1>
        <Card className="animate-fade-in shadow-lg">
          <CardContent className="p-8">
          <div
            className="prose prose-sm max-w-none prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--foreground))] prose-a:text-[hsl(var(--primary))] prose-a:no-underline hover:prose-a:underline prose-strong:text-[hsl(var(--foreground))] prose-ul:text-[hsl(var(--foreground))] prose-ol:text-[hsl(var(--foreground))]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
