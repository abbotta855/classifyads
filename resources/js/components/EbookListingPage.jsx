import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ebookAPI } from '../utils/api';

function EbookListingPage() {
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
      setEbooks(response.data.data || response.data);
      if (response.data.last_page) {
        setLastPage(response.data.last_page);
      }
    } catch (error) {
      console.error('Error fetching eBooks:', error);
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">eBooks</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search eBooks by title, writer, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p>Loading eBooks...</p>
          </div>
        ) : ebooks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No eBooks found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ebooks.map((ebook) => (
                <Link key={ebook.id} to={`/ebooks/${ebook.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      {ebook.cover_image ? (
                        <img
                          src={ebook.cover_image}
                          alt={ebook.title}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded mb-3 flex items-center justify-center">
                          <span className="text-gray-400">No Cover</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{ebook.title}</h3>
                      {ebook.writer && (
                        <p className="text-sm text-gray-600 mb-2">By {ebook.writer}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          Rs {parseFloat(ebook.price || 0).toFixed(2)}
                        </span>
                        {ebook.overall_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm">{ebook.overall_rating.toFixed(1)}</span>
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
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {lastPage}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                >
                  Next
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

