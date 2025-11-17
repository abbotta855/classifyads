import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function Homepage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await window.axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-[hsl(var(--muted-foreground))]">Loading categories...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--foreground))] mb-4">
            Welcome to ClassifiedAds
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] mb-8">
            Browse, buy, sell, and bid on items in your local area
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/categories">
              <Button size="lg">
                Browse Categories
              </Button>
            </Link>
          </div>
        </section>

        {/* Categories Grid */}
        <section>
          <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">
            Browse by Category
          </h2>
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-[hsl(var(--muted-foreground))]">
                  No categories available yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">
                      <Link
                        to={`/categories/${category.slug}`}
                        className="text-[hsl(var(--primary))] hover:underline"
                      >
                        {category.name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                      {category.description || 'No description available.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {category.ad_count} ads
                      </span>
                      {category.subcategories.length > 0 && (
                        <span className="text-sm text-[hsl(var(--primary))]">
                          {category.subcategories.length} subcategories
                        </span>
                      )}
                    </div>
                    {category.subcategories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                          Subcategories:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories.slice(0, 3).map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categories/${category.slug}/${sub.slug}`}
                              className="text-xs px-2 py-1 bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] rounded hover:bg-[hsl(var(--accent))] transition-colors"
                            >
                              {sub.name} ({sub.ad_count})
                            </Link>
                          ))}
                          {category.subcategories.length > 3 && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              +{category.subcategories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Homepage;

