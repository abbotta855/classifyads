import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nepaliProductAPI } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './ui/empty-state';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from './SEOHead';
import LazyImage from './LazyImage';

export default function NepaliProductList() {
  const [products, setProducts] = React.useState([]);
  const [meta, setMeta] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState({
    category_id: '',
    subcategory_id: '',
    min_price: '',
    max_price: '',
  });
  const [categories, setCategories] = React.useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      // Merge search and filters
      const queryParams = {
        ...params,
        search: search || undefined,
        category_id: filters.category_id || undefined,
        subcategory_id: filters.subcategory_id || undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
      };
      // Remove undefined values
      Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);
      
      const res = await nepaliProductAPI.list(queryParams);
      const payload = res.data;
      
      // Handle paginated response structure
      if (Array.isArray(payload)) {
        // Direct array response
        setProducts(payload);
        setMeta(null);
      } else if (payload && Array.isArray(payload.data)) {
        // Paginated response: { data: [...], current_page, last_page, etc. }
        setProducts(payload.data);
        setMeta(payload);
      } else {
        // Unexpected structure, log and set empty
        console.warn('Unexpected Nepali Products response structure:', payload);
        setProducts([]);
        setMeta(null);
      }
    } catch (e) {
      console.error('Failed to load products', e);
      // Set empty array on error so UI shows "No products found" instead of crashing
      setProducts([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [filters]);

  // Fetch categories (if API exists)
  React.useEffect(() => {
    // This would need a categories API endpoint
    // For now, we'll skip it or use a placeholder
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
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
          <Button
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: '/nepali-products/new' } });
              } else {
                navigate('/nepali-products/new');
              }
            }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Filter Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min Price (Rs.)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => setFilters({...filters, min_price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Price (Rs.)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => setFilters({...filters, max_price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={filters.category_id}
                  onChange={(e) => setFilters({...filters, category_id: e.target.value, subcategory_id: ''})}
                  className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[hsl(var(--primary))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                >
                  <option value="">All Categories</option>
                  {/* Categories would be loaded from API */}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ category_id: '', subcategory_id: '', min_price: '', max_price: '' });
                    setSearch('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-fade-in">
              <CardContent className="p-0">
                <Skeleton className="w-full aspect-square rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          title="No Products Found"
          description={search ? `No products match your search "${search}". Try different keywords or clear filters.` : "No products are available at the moment. Be the first to add a product!"}
          action={() => {
            if (!user) {
              navigate('/login', { state: { from: '/nepali-products/new' } });
            } else {
              navigate('/nepali-products/new');
            }
          }}
          actionLabel="Add First Product"
        />
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {products.map((product, index) => (
              <Card 
                key={product.id} 
                className="overflow-hidden card-hover group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link to={`/nepali-products/${product.slug || product.id}`}>
                  <div className="aspect-square bg-[hsl(var(--muted))] overflow-hidden relative">
                    {product.primary_image ? (
                      <LazyImage
                        src={product.primary_image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {product.status === 'pending' && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                        Pending
                      </div>
                    )}
                    {product.status === 'rejected' && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                        Rejected
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">{product.title}</h3>
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
                      <p className="font-semibold text-[hsl(var(--primary))] text-lg">
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

