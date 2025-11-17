import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function CategoriesPage() {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
            All Categories
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Browse all available categories and subcategories
          </p>
        </div>

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
                  <div className="flex items-center justify-between mb-4">
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
                    <div className="pt-4 border-t border-[hsl(var(--border))]">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Subcategories:
                      </p>
                      <div className="space-y-1">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${category.slug}/${sub.slug}`}
                            className="block text-sm text-[hsl(var(--primary))] hover:underline transition-colors"
                          >
                            {sub.name} ({sub.ad_count})
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CategoriesPage;

