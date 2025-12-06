import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { recentlyViewedAPI } from '../../utils/api';

export default function RecentlyViewedWidget() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentlyViewed();
  }, []);

  const fetchRecentlyViewed = async () => {
    try {
      const response = await recentlyViewedAPI.getRecentlyViewed();
      setRecentlyViewed((response.data || []).slice(0, 6));
    } catch (err) {
      console.error('Failed to fetch recently viewed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recently Viewed</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/dashboard/recently-viewed'}
            className="text-xs"
          >
            View all →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {recentlyViewed.map((item) => {
            const ad = item.ad || item;
            return (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => window.location.href = `/ads/${ad.id}`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[hsl(var(--muted))] mb-2">
                  <img
                    src={ad.image1_url || ad.photos?.[0]?.photo_url || '/placeholder-image.png'}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 group-hover:text-[hsl(var(--foreground))] transition-colors">
                  {ad.title}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

