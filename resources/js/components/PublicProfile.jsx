import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicProfileAPI, ratingAPI } from '../utils/api';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      loadRatings();
    }
  }, [userId, ratingsPage, profile]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicProfileAPI.getProfile(userId);
      setProfile(res.data);
      // If we have recent_reviews in profile data, use them as initial ratings
      if (res.data?.recent_reviews && res.data.recent_reviews.length > 0) {
        setRatings(res.data.recent_reviews);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to load profile. The user may not exist or has been removed.';
      setError(errorMessage);
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    if (!userId) return;
    
    setRatingsLoading(true);
    try {
      const res = await publicProfileAPI.getRatings(userId, ratingsPage, 10);
      // Laravel pagination returns data in 'data' property
      // Check both res.data.data (paginated) and res.data (direct array)
      const ratingsData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      
      if (ratingsPage === 1) {
        setRatings(ratingsData);
      } else {
        setRatings(prev => [...prev, ...ratingsData]);
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
      console.error('Error details:', err.response?.data);
      // If there's an error on first load and we have recent_reviews from profile, use those as fallback
      if (ratingsPage === 1) {
        if (profile?.recent_reviews && profile.recent_reviews.length > 0) {
          setRatings(profile.recent_reviews);
        } else {
          setRatings([]);
        }
      }
    } finally {
      setRatingsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-[hsl(var(--muted-foreground))]">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
              <Button onClick={() => navigate(-1)} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const { user, stats, ads, recent_reviews } = profile;
  
  // Use recent_reviews as fallback if ratings haven't loaded yet
  const allRatings = ratings.length > 0 ? ratings : (recent_reviews || []);
  
  // Show only last 5 reviews initially, or all if showAllReviews is true
  // Reviews are already sorted by created_at desc, so first 5 are the most recent
  const displayRatings = showAllReviews || allRatings.length <= 5 
    ? allRatings 
    : allRatings.slice(0, 5);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
                  {user.name}
                </h1>
                {user.location && (
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">
                    📍 {user.location.name}
                    {user.selected_local_address && `, ${user.selected_local_address}`}
                  </p>
                )}
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-lg">
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      {stats.total_ads}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Ads</p>
                  </div>
                  <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-lg">
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      {stats.active_ads}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Ads</p>
                  </div>
                  <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-lg">
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      {stats.sold_ads}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Sold</p>
                  </div>
                  <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {renderStars(Math.round(stats.average_rating))}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {stats.average_rating.toFixed(1)} ({stats.total_ratings} reviews)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Ads */}
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {ads && ads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ads.map((ad) => (
                      <Link
                        key={ad.id}
                        to={(() => {
                          // Generate category-based URL
                          const generateCategorySlug = (categoryName) => {
                            if (!categoryName) return 'uncategorized';
                            return categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                          };
                          const categoryName = ad.category?.category || 'uncategorized';
                          const categorySlug = generateCategorySlug(categoryName);
                          const adSlug = ad.slug || ad.id;
                          return `/${categorySlug}/${adSlug}`;
                        })()}
                        className="block group"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative">
                            <img
                              src={ad.image1_url || ad.photos?.[0]?.photo_url || '/placeholder-image.png'}
                              alt={ad.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                              {ad.title}
                            </h3>
                            <p className="text-lg font-bold text-[hsl(var(--primary))]">
                              Rs. {parseFloat(ad.price || 0).toLocaleString()}
                            </p>
                            {ad.category && (
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                {ad.category.category}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                    No active listings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({stats.total_ratings})</CardTitle>
              </CardHeader>
              <CardContent>
                {ratingsLoading && ratings.length === 0 && (!recent_reviews || recent_reviews.length === 0) ? (
                  <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                    Loading reviews...
                  </p>
                ) : displayRatings.length > 0 ? (
                  <div className="space-y-4">
                    {displayRatings.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-[hsl(var(--border))] pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {review.user_profile_picture ? (
                              <img
                                src={review.user_profile_picture}
                                alt={review.user_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">
                                  {review.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-[hsl(var(--foreground))]">
                                {review.user_name}
                              </p>
                              {review.purchase_verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  ✓ Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-[hsl(var(--foreground))] mb-2">
                                {review.comment}
                              </p>
                            )}
                            {review.criteria_scores && review.criteria_scores.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {review.criteria_scores.map((cs, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="text-[hsl(var(--muted-foreground))]">
                                      {cs.criteria_name}:
                                    </span>
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={star}
                                          className={`text-xs ${
                                            star <= cs.score ? 'text-yellow-400' : 'text-gray-300'
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {review.ad_title && (
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                                For: {review.ad_title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Show "See More" button if there are more than 5 reviews and not showing all */}
                    {allRatings.length > 5 && !showAllReviews && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setShowAllReviews(true)}
                      >
                        See More Reviews ({allRatings.length - 5} more)
                      </Button>
                    )}
                    {/* Show "Show Less" button if showing all reviews and there are more than 5 */}
                    {allRatings.length > 5 && showAllReviews && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          setShowAllReviews(false);
                          // Scroll to top of reviews section
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Show Less
                      </Button>
                    )}
                    {/* Load More button for pagination (if using API pagination) */}
                    {ratings.length >= 10 && showAllReviews && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setRatingsPage(prev => prev + 1)}
                        disabled={ratingsLoading}
                      >
                        {ratingsLoading ? 'Loading...' : 'Load More Reviews'}
                      </Button>
                    )}
                    {displayRatings.length > 0 && ratings.length === 0 && recent_reviews && recent_reviews.length > 0 && (
                      <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-4">
                        Showing recent reviews. Full list loading...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                    No reviews yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-[hsl(var(--foreground))] mb-2">
                    {stats.average_rating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {renderStars(Math.round(stats.average_rating))}
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Based on {stats.total_ratings} review{stats.total_ratings !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2 mt-6">
                  {[5, 4, 3, 2, 1].reverse().map((star) => {
                    const count = stats.rating_distribution[star] || 0;
                    const percentage = stats.total_ratings > 0
                      ? (count / stats.total_ratings) * 100
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm w-8">{star}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews Preview */}
            {recent_reviews && recent_reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recent_reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b border-[hsl(var(--border))] pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          - {review.user_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PublicProfile;

