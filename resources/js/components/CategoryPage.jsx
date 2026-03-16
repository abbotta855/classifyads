import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function CategoryPage() {
  const { slug, subSlug } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  const fetchCategory = async () => {
    try {
      const response = await window.axios.get(`/api/categories/${slug}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-[hsl(var(--muted-foreground))]">Loading category...</p>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Category not found.</p>
            <Link to="/" className="text-[hsl(var(--primary))] hover:underline mt-4 inline-block">
              Return to homepage
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const displaySubcategory = subSlug
    ? category.subcategories.find((sub) => sub.slug === subSlug)
    : null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <nav className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
          <Link to="/" className="hover:text-[hsl(var(--primary))] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-[hsl(var(--primary))] transition-colors">
            Categories
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[hsl(var(--foreground))]">{category.name}</span>
          {displaySubcategory && (
            <>
              <span className="mx-2">/</span>
              <span className="text-[hsl(var(--foreground))]">{displaySubcategory.name}</span>
            </>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
            {displaySubcategory ? displaySubcategory.name : category.name}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {displaySubcategory
              ? displaySubcategory.description || 'No description available.'
              : category.description || 'No description available.'}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            {displaySubcategory
              ? `${displaySubcategory.ad_count} ads`
              : `${category.ad_count} total ads`}
          </p>
        </div>

        {!displaySubcategory && category.subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
              Subcategories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.subcategories.map((subcategory) => (
                <Card
                  key={subcategory.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <Link
                        to={`/categories/${category.slug}/${subcategory.slug}`}
                        className="text-[hsl(var(--primary))] hover:underline"
                      >
                        {subcategory.name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                      {subcategory.description || 'No description available.'}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {subcategory.ad_count} ads
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for listings - will be implemented later */}
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
            {displaySubcategory ? 'Listings' : 'All Listings'}
          </h2>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-[hsl(var(--muted-foreground))]">
                Listings will be displayed here. This feature will be implemented in a later milestone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default CategoryPage;

