import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ratingAPI, publicProfileAPI, favouriteAPI, watchlistAPI, userAdAPI, publicAdAPI } from '../utils/api';
import RatingModal from './RatingModal';
import axios from 'axios';

function AdDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);

  useEffect(() => {
    loadAd();
  }, [id]);

  useEffect(() => {
    if (ad && user) {
      checkFavourite();
      checkWatchlist();
      loadSellerRating();
    }
  }, [ad, user]);

  const loadAd = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/ads/${id}`);
      setAd(response.data);
      
      // Track view and click
      if (user) {
        try {
          await userAdAPI.incrementView(id);
        } catch (err) {
          // Silently fail
        }
      }
      
      // Track click (for both authenticated and anonymous users)
      try {
        await publicAdAPI.trackClick(id);
      } catch (err) {
        // Silently fail
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load ad');
      console.error('Error loading ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavourite = async () => {
    if (!user || !ad) return;
    try {
      const res = await favouriteAPI.check(ad.id);
      setIsFavourite(res.data.is_favourite || false);
    } catch (err) {
      // Silently fail
    }
  };

  const checkWatchlist = async () => {
    if (!user || !ad) return;
    try {
      const res = await watchlistAPI.checkWatchlist(ad.id);
      setIsWatchlist(res.data.is_watchlist || false);
    } catch (err) {
      // Silently fail
    }
  };

  const loadSellerRating = async () => {
    if (!ad?.seller?.id) return;
    try {
      const res = await ratingAPI.getSellerRatings(ad.seller.id);
      if (res.data.total_ratings > 0) {
        setSellerRating({
          average: res.data.average_rating,
          total: res.data.total_ratings,
        });
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleToggleFavourite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFavourite) {
        await favouriteAPI.removeByAd(ad.id);
        setIsFavourite(false);
      } else {
        await favouriteAPI.add({ ad_id: ad.id });
        setIsFavourite(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update favourite');
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isWatchlist) {
        await watchlistAPI.removeWatchlistByAd(ad.id);
        setIsWatchlist(false);
      } else {
        await watchlistAPI.add({ ad_id: ad.id });
        setIsWatchlist(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update watchlist');
    }
  };

  const handleRateSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id === ad.user_id) {
      alert('You cannot rate your own ad.');
      return;
    }

    setShowRatingModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-[hsl(var(--muted-foreground))]">Loading ad details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !ad) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Ad not found'}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const images = ad.images || [ad.image] || ['/placeholder-image.png'];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {showRatingModal && ad.seller && (
          <RatingModal
            ad={ad}
            seller={ad.seller}
            onClose={() => setShowRatingModal(false)}
            onSuccess={() => {
              setShowRatingModal(false);
              loadSellerRating();
            }}
          />
        )}

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <Card className="mb-4">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={images[selectedImageIndex] || '/placeholder-image.png'}
                    alt={ad.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  {ad.item_sold && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
                      SOLD
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-[hsl(var(--primary))]'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img || '/placeholder-image.png'}
                      alt={`${ad.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Ad Details */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[hsl(var(--foreground))] whitespace-pre-wrap">
                  {ad.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            {/* Ad Info Card */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">
                  {ad.title}
                </h1>
                
                <div className="text-4xl font-bold text-[hsl(var(--primary))] mb-6">
                  Rs. {parseFloat(ad.price || 0).toLocaleString()}
                </div>

                {/* Ad Meta Info */}
                <div className="space-y-3 mb-6 text-sm">
                  {ad.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-[hsl(var(--muted-foreground))]">Category:</span>
                      <span className="font-semibold">{ad.category}</span>
                      {ad.subcategory && (
                        <span className="text-[hsl(var(--muted-foreground))]">
                          &gt; {ad.subcategory}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {ad.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-[hsl(var(--muted-foreground))]">📍 Location:</span>
                      <span className="font-semibold">{ad.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[hsl(var(--muted-foreground))]">👁️ Views:</span>
                    <span className="font-semibold">{ad.views || 0}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[hsl(var(--muted-foreground))]">📅 Posted:</span>
                    <span className="font-semibold">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {user && user.id !== ad.user_id && (
                    <>
                      <Button
                        onClick={handleToggleFavourite}
                        variant={isFavourite ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {isFavourite ? '❤️ Remove from Favourites' : '🤍 Add to Favourites'}
                      </Button>
                      
                      <Button
                        onClick={handleToggleWatchlist}
                        variant={isWatchlist ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {isWatchlist ? '👁️ Remove from Watchlist' : '👁️ Add to Watchlist'}
                      </Button>

                      <Button
                        onClick={handleRateSeller}
                        variant="outline"
                        className="w-full"
                      >
                        ⭐ Rate Seller
                      </Button>
                    </>
                  )}

                  {!user && (
                    <Button
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="w-full"
                    >
                      Login to Interact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seller Info Card */}
            {ad.seller && (
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {ad.seller.profile_picture ? (
                        <img
                          src={ad.seller.profile_picture}
                          alt={ad.seller.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">
                          {ad.seller.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-[hsl(var(--foreground))]">
                        {ad.seller.name}
                      </h3>
                      {ad.seller.location && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          📍 {ad.seller.location.name}
                        </p>
                      )}
                      {sellerRating && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold">
                            {sellerRating.average.toFixed(1)} ({sellerRating.total} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/profile/${ad.seller.id}`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      View Seller Profile →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdDetailPage;

