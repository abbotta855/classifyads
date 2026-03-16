import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get('q') || '');
  const [type, setType] = React.useState(searchParams.get('type') || 'all');
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const performSearch = async (searchQuery = query, searchType = type) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get('/api/search', {
        params: {
          q: searchQuery,
          type: searchType,
        },
      });
      setResults(res.data);
      setSearchParams({ q: searchQuery, type: searchType });
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const q = searchParams.get('q');
    const t = searchParams.get('type') || 'all';
    if (q) {
      setQuery(q);
      setType(t);
      performSearch(q, t);
    }
  }, [searchParams]);

  const handleAutocomplete = async (value) => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get('/api/search/autocomplete', {
        params: { q: value, limit: 5 },
      });
      setSuggestions(res.data.suggestions || []);
    } catch (e) {
      console.error('Autocomplete failed', e);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const renderResults = (items, title, type) => {
    if (!items || items.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title} ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link key={`${type}-${item.id}`} to={item.url}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-semibold mb-1 line-clamp-2">{item.title}</h3>
                    {item.price && (
                      <p className="text-[hsl(var(--primary))] font-bold">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    )}
                    {item.current_bid && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Current Bid: Rs. {item.current_bid.toLocaleString()}
                      </p>
                    )}
                    {item.replies !== undefined && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {item.replies} replies • {item.views} views
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Search</h1>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search for ads, auctions, eBooks, products, or forum threads..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      handleAutocomplete(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuery(suggestion.text);
                            setShowSuggestions(false);
                            performSearch(suggestion.text);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] flex items-center justify-between"
                        >
                          <span>{suggestion.text}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {suggestion.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="ads">Ads</option>
                  <option value="auctions">Auctions</option>
                  <option value="ebooks">eBooks</option>
                  <option value="products">Products</option>
                  <option value="forum">Forum</option>
                </select>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))]">Searching...</p>
          </div>
        )}

        {!loading && results && (
          <>
            {results.total === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-[hsl(var(--muted-foreground))]">
                    No results found for "{results.query}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Found {results.total} result{results.total !== 1 ? 's' : ''} for "{results.query}"
                  </p>
                </div>
                {renderResults(results.results.ads, 'Ads', 'ad')}
                {renderResults(results.results.auctions, 'Auctions', 'auction')}
                {renderResults(results.results.ebooks, 'eBooks', 'ebook')}
                {renderResults(results.results.products, 'Products', 'product')}
                {renderResults(results.results.forum_threads, 'Forum Threads', 'forum')}
              </>
            )}
          </>
        )}

        {!loading && !results && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-[hsl(var(--muted-foreground))]">
                Enter a search query to find ads, auctions, eBooks, products, or forum threads.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

