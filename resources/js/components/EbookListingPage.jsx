import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './ui/empty-state';
import { ebookAPI } from '../utils/api';
import { useTranslation } from '../utils/translation';

function EbookListingPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchEbooks();
  }, [currentPage, searchQuery]);

  const fetchEbooks = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        search: searchQuery || undefined,
      };
      const response = await ebookAPI.getEbooks(params);
      
      // Handle paginated response structure
      if (response.data && Array.isArray(response.data.data)) {
        // Paginated response: { data: [...], current_page, last_page, etc. }
        setEbooks(response.data.data);
        if (response.data.last_page) {
          setLastPage(response.data.last_page);
        }
      } else if (Array.isArray(response.data)) {
        // Direct array response
        setEbooks(response.data);
        setLastPage(1);
      } else {
        // Unexpected structure, log and set empty
        console.warn('Unexpected eBook response structure:', response.data);
        setEbooks([]);
        setLastPage(1);
      }
    } catch (error) {
      console.error('Error fetching eBooks:', error);
      // Set empty array on error so UI shows "No eBooks found" instead of crashing
      setEbooks([]);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({ search: searchQuery });
    fetchEbooks();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-6 text-[hsl(var(--foreground))]">{t('ebooks.title')}</h1>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <Input
              type="text"
              placeholder={t('ebooks.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">{t('common.search')}</Button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-fade-in">
                <CardContent className="p-4">
                  <Skeleton className="w-full h-48 rounded mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ebooks.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title={t('ebooks.noEbooksFound')}
            description={searchQuery ? t('ebooks.noEbooksMatchSearch', { searchQuery }) : t('ebooks.noEbooksAvailable')}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ebooks.map((ebook, index) => (
                <Link 
                  key={ebook.id} 
                  to={`/ebooks/${ebook.id}`}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full group">
                    <CardContent className="p-4">
                      {ebook.cover_image ? (
                        <div className="relative overflow-hidden rounded mb-3">
                          <img
                            src={ebook.cover_image}
                            alt={ebook.title}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-[hsl(var(--muted))] rounded mb-3 flex items-center justify-center">
                          <svg className="w-12 h-12 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">{ebook.title}</h3>
                      {ebook.writer && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{t('ebooks.by')} {ebook.writer}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold text-[hsl(var(--primary))]">
                          {t('ebooks.price', { price: parseFloat(ebook.price || 0).toFixed(2) })}
                        </span>
                        {ebook.overall_rating > 0 && (
                          <div className="flex items-center gap-1 bg-[hsl(var(--muted))] px-2 py-1 rounded-full">
                            <span className="text-yellow-500 text-sm">★</span>
                            <span className="text-sm font-medium">{ebook.overall_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                <span className="flex items-center px-4">
                  {t('ebooks.pageOf', { currentPage, lastPage })}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default EbookListingPage;

