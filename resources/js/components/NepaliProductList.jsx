import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nepaliProductAPI } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from './SEOHead';
import LazyImage from './LazyImage';

export default function NepaliProductList() {
  const [products, setProducts] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      const res = await nepaliProductAPI.list(params);
      const payload = res.data;
      if (Array.isArray(payload)) {
        setProducts(payload);
        setMeta(null);
      } else {
        setProducts(payload.data || []);
        setMeta(payload);
      }
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts({ search: search || undefined });
  };

  const handlePage = (url) => {
    if (!url) return;
    const params = new URL(url, window.location.origin);
    const page = params.searchParams.get('page') || 1;
    fetchProducts({ search: search || undefined, page });
  };

  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  return (
    <>
      <SEOHead
        title="Nepali Products"
        description="Discover authentic Nepali products made in Nepal. Support local businesses and find unique products."
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          ← Back to Homepage
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-3xl font-bold">Nepali Products</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
        {user && (
          <Link to="/nepali-products/new">
            <Button>Add Product</Button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">Loading products...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">No products found.</p>
            {user && (
              <Link to="/nepali-products/new">
                <Button>Add First Product</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/nepali-products/${product.slug || product.id}`}>
                  <div className="aspect-square bg-[hsl(var(--muted))] overflow-hidden relative">
                    {product.primary_image ? (
                      <LazyImage
                        src={product.primary_image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                        No Image
                      </div>
                    )}
                    {product.status === 'pending' && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Pending
                      </div>
                    )}
                    {product.status === 'rejected' && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Rejected
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                      {product.company_name}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(product.rating_average || 0)}</div>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        ({product.rating_count || 0})
                      </span>
                    </div>
                    {product.retail_price && (
                      <p className="font-semibold text-[hsl(var(--primary))]">
                        Rs. {product.retail_price.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && (meta.prev_page_url || meta.next_page_url) && (
            <div className="flex justify-between items-center mt-8">
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
              <Button
                onClick={() => handlePage(meta.next_page_url)}
                disabled={!meta.next_page_url}
              >
                Next
              </Button>
            </div>
          )}

          {/* "More" button if products > 24 */}
          {meta && meta.total > 24 && meta.current_page === 1 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => handlePage(meta.next_page_url)}>
                Load More Products
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}

