import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ratingAPI, publicProfileAPI, favouriteAPI, watchlistAPI, userAdAPI, publicAdAPI, buyerSellerMessageAPI, orderAPI } from '../utils/api';
import { useToast } from './Toast';
import RatingModal from './RatingModal';
import axios from 'axios';
import { useTranslation } from '../utils/translation';

function AdDetailPage() {
  const { slug, categorySlug, adSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Purchase-related state
  const [quantity, setQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [textToSeller, setTextToSeller] = useState('');
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sendingTextToSeller, setSendingTextToSeller] = useState(false);

  // Determine which identifier to use (categorySlug/adSlug or slug)
  const adIdentifier = adSlug || slug;

  useEffect(() => {
    loadAd();
  }, [adIdentifier]);

  // Helper function to generate category slug from category name
  const generateCategorySlug = (categoryName) => {
    if (!categoryName) return 'uncategorized';
    return categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Update URL to use category slug + ad slug format
  useEffect(() => {
    if (ad && ad.slug && ad.category) {
      const currentPath = window.location.pathname;
      const categorySlug = generateCategorySlug(ad.category);
      const newPath = `/${categorySlug}/${ad.slug}`;
      
      // Check if current URL uses numeric ID (either in /ads/ID or /category/ID format)
      const isNumericId = /^\/(?:ads|[\w-]+)\/\d+$/.test(currentPath);
      const isOldAdsFormat = /^\/ads\/(\d+|.+)$/.test(currentPath);
      
      // Update URL if it's using numeric ID or old /ads/ format
      if ((isNumericId || isOldAdsFormat) && currentPath !== newPath) {
        // Replace with category-based URL using React Router (without page reload)
        navigate(newPath, { replace: true });
      }
    }
  }, [ad, navigate]);

  useEffect(() => {
    if (ad && user) {
      checkFavourite();
      checkWatchlist();
      loadSellerRating();
    }
    if (ad?.user_id) {
      loadSellerProfile();
    }
  }, [ad, user]);

  useEffect(() => {
    if (showMessageModal && ad && user) {
      loadConversation();
    }
  }, [showMessageModal, ad, user]);

  const loadAd = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/ads/${adIdentifier}`);
      setAd(response.data);
      
      if (user) {
        try {
          await userAdAPI.incrementView(response.data.id);
        } catch (err) {
          // Silently fail
        }
      }
      
      try {
        await publicAdAPI.trackClick(response.data.id);
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

  const loadSellerProfile = async () => {
    if (!ad?.user_id) return;
    try {
      const response = await publicProfileAPI.getProfile(ad.user_id);
      setSellerProfile(response.data);
    } catch (err) {
      console.error('Error loading seller profile:', err);
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
        await favouriteAPI.removeFavouriteByAd(ad.id);
        setIsFavourite(false);
      } else {
        await favouriteAPI.addFavourite(ad.id);
        setIsFavourite(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update favourite', 'error');
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
        await watchlistAPI.addWatchlist(ad.id);
        setIsWatchlist(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update watchlist', 'error');
    }
  };

  const handleRateSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id === ad.user_id) {
      showToast('You cannot rate your own ad.', 'warning');
      return;
    }

    setShowRatingModal(true);
  };

  const loadConversation = async () => {
    if (!ad || !user) return;
    
    setLoadingMessages(true);
    try {
      const response = await buyerSellerMessageAPI.getConversation(ad.id);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ad || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      await buyerSellerMessageAPI.sendMessage(ad.id, {
        message: newMessage.trim(),
        sender_type: 'buyer',
      });
      setNewMessage('');
      loadConversation();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendTextToSeller = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id === ad.user_id) {
      showToast('You cannot contact yourself.', 'warning');
      return;
    }

    if (!textToSeller.trim() || sendingTextToSeller) {
      return;
    }

    setSendingTextToSeller(true);
    try {
      await buyerSellerMessageAPI.sendMessage(ad.id, {
        message: textToSeller.trim(),
        sender_type: 'buyer',
      });
      setTextToSeller('');
      showToast('Message sent successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSendingTextToSeller(false);
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(ad?.price || 0);
    return (basePrice * quantity + shippingCost).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getCart = () => {
    try {
      const raw = localStorage.getItem('demo_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem('demo_cart', JSON.stringify(cart));
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const price = parseFloat(ad?.price || 0);
    if (!price) {
      showToast('Price not available', 'error');
      return;
    }
    const cart = getCart();
    const existingIdx = cart.findIndex((item) => item.ad_id === ad.id);
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += quantity;
      cart[existingIdx].total = cart[existingIdx].quantity * cart[existingIdx].price;
    } else {
      cart.push({
        ad_id: ad.id,
        title: ad.title,
        price,
        quantity,
        total: price * quantity,
        image: images?.[0] || '',
      });
    }
    saveCart(cart);
    showToast('Added to cart', 'success');
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const price = parseFloat(ad?.price || 0);
    if (!price) {
      showToast('Price not available', 'error');
      return;
    }
    // Use the same checkout path (single-item) for demo
    try {
      const res = await orderAPI.checkout([{ ad_id: ad.id, quantity }]);
      showToast(res.data?.message || 'Buy Now completed (demo). Payment simulated.', 'success');
    } catch (e) {
      if (e.response?.status === 402 && e.response?.data?.needs_top_up) {
        showToast('Insufficient wallet balance. Please add funds to your e-wallet to complete purchase.', 'error');
        navigate('/user_dashboard/e-wallet');
        return;
      }
      const errorMsg = e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Failed to process Buy Now.';
      showToast(errorMsg, 'error');
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = ad?.title || '';
    const text = ad?.description || '';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const calculateShipping = () => {
    // TODO: Implement shipping calculator
    setShippingCost(200); // Placeholder
    setEstimatedDelivery('3-5 business days');
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

  const images = ad.images || [ad.image1_url, ad.image2_url, ad.image3_url, ad.image4_url].filter(Boolean) || ['/placeholder-image.png'];
  const pricePerUnit = parseFloat(ad.price || 0);
  const totalPrice = pricePerUnit * quantity + shippingCost;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

        {/* Watchlist & Favourite Buttons - Top of Page */}
        {user && ad && user.id !== ad.user_id && (
          <div className="mb-4 flex gap-2 justify-end">
            <Button
              onClick={handleToggleFavourite}
              variant={isFavourite ? 'default' : 'outline'}
              className="flex items-center gap-2"
              size="lg"
            >
              {isFavourite ? '❤️' : '🤍'} {t('productDetail.favourite')}
            </Button>
            <Button
              onClick={handleToggleWatchlist}
              variant={isWatchlist ? 'default' : 'outline'}
              className="flex items-center gap-2"
              size="lg"
            >
              {isWatchlist ? '👁️' : '👁️'} {t('productDetail.watchlist')}
            </Button>
          </div>
        )}

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← {t('common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ad Title & Basic Info - Above Images */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4 leading-tight">
                  {ad.title}
                </h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                  {ad.category_path && (
                    <div className="flex items-center gap-2">
                      <span>🏷️</span>
                      <span className="text-[hsl(var(--foreground))]">{ad.category_path}</span>
                    </div>
                  )}
                  {!ad.category_path && ad.category && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('productDetail.category')}:</span>
                      <span className="text-[hsl(var(--foreground))]">{ad.category}</span>
                      {ad.subcategory && (
                        <span className="text-[hsl(var(--muted-foreground))]">
                          &gt; {ad.subcategory}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {ad.location && (
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="text-[hsl(var(--foreground))]">{ad.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="text-[hsl(var(--foreground))]">
                      {new Date(ad.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>👁️</span>
                    <span className="text-[hsl(var(--foreground))]">{ad.views || 0} {t('productDetail.views')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Image Gallery */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                  <img
                    src={images[selectedImageIndex] || '/placeholder-image.png'}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  {ad.status === 'sold' && (
                    <div className="absolute top-6 right-6 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg">
                      SOLD
                    </div>
                  )}
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImageIndex === index
                        ? 'border-[hsl(var(--primary))] shadow-md'
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

            {/* Description Section - Above seller info */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{t('productDetail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Size & Weight (if applicable) */}
                {(ad.size || ad.weight) && (
                  <div className="flex gap-6 mb-4 pb-4 border-b border-[hsl(var(--border))]">
                    {ad.size && (
                      <div>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{t('productDetail.size')}:</span>
                        <span className="ml-2 font-medium text-[hsl(var(--foreground))]">{ad.size}</span>
                      </div>
                    )}
                    {ad.weight && (
                      <div>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{t('productDetail.weight')}:</span>
                        <span className="ml-2 font-medium text-[hsl(var(--foreground))]">{ad.weight}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed">
                  {ad.description || t('productDetail.noDescriptionProvided')}
                </p>
              </CardContent>
            </Card>

            {/* Seller Information - Combined with Shipping Info */}
            {ad.seller && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t('productDetail.sellerInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seller Name & Rating */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                      {ad.seller.profile_picture ? (
                        <img
                          src={ad.seller.profile_picture}
                          alt={ad.seller.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-500 font-semibold">
                          {ad.seller.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${ad.seller.id}`}
                        className="block hover:underline"
                      >
                        <h3 className="font-semibold text-lg text-[hsl(var(--foreground))] truncate">
                          {ad.seller.name}
                        </h3>
                      </Link>
                      {sellerRating && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {sellerRating.average.toFixed(1)} ({sellerRating.total} {t('productDetail.reviews')})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 pt-4 border-t border-[hsl(var(--border))]">
                    {/* Mobile - Only show if seller wants to share (if phone exists) */}
                    {(sellerProfile?.user?.phone || sellerProfile?.user?.mobile) && (
                      <div>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                          {t('productDetail.mobile')}
                        </label>
                        <p className="text-sm text-[hsl(var(--foreground))]">
                          {sellerProfile.user.phone || sellerProfile.user.mobile}
                        </p>
                      </div>
                    )}
                    
                    {/* Email */}
                    {sellerProfile?.user?.email && (
                      <div>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                          {t('productDetail.email')}
                        </label>
                        <p className="text-sm text-[hsl(var(--foreground))]">{sellerProfile.user.email}</p>
                      </div>
                    )}

                    {/* Text to Seller */}
                    {user && user.id !== ad.user_id && (
                      <form onSubmit={handleSendTextToSeller}>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-2">
                          {t('productDetail.textToSeller')}
                        </label>
                        <textarea
                          value={textToSeller}
                          onChange={(e) => setTextToSeller(e.target.value)}
                          placeholder={t('productDetail.typeYourMessage')}
                          className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm resize-none mb-2"
                          rows="3"
                          disabled={sendingTextToSeller}
                        />
                        <Button
                          type="submit"
                          disabled={!textToSeller.trim() || sendingTextToSeller}
                          className="w-full"
                        >
                          {sendingTextToSeller ? t('productDetail.sending') : t('productDetail.sendMessage')}
                        </Button>
                      </form>
                    )}

                    {/* Response Rate */}
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                        {t('productDetail.responseRate')}
                      </label>
                      <p className="text-sm text-[hsl(var(--foreground))]">{t('productDetail.usuallyRespondsWithin24Hours')}</p>
                    </div>
                  </div>

                  {/* Shipping Information - Combined with Seller Info */}
                  <div className="space-y-3 pt-4 border-t border-[hsl(var(--border))]">
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-2">
                        {t('productDetail.shippingCalculator')}
                      </label>
                      <Button
                        onClick={calculateShipping}
                        variant="outline"
                        className="w-full"
                      >
                        {t('productDetail.calculateShipping')}
                      </Button>
                    </div>
                    
                    {shippingCost > 0 && (
                      <>
                        <div>
                          <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                            {t('productDetail.shippingCost')}
                          </label>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {t('homepage.pricePrefix')} {shippingCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                            {t('productDetail.estimatedDeliveryTime')}
                          </label>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {estimatedDelivery || t('productDetail.notCalculated')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                    <Link
                      to={`/profile/${ad.seller.id}`}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        {t('productDetail.viewSellerProfile')} →
                      </Button>
                    </Link>
                    {user && user.id !== ad.user_id && (
                      <Button
                        onClick={handleRateSeller}
                        variant="outline"
                        className="w-full"
                      >
                        ⭐ {t('productDetail.rateSeller')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share this Ad - After shipping info */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t('productDetail.shareThisAd')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <span>📘</span> {t('productDetail.facebook')}
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    <span>💬</span> {t('productDetail.whatsapp')}
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                  >
                    <span>✉️</span> {t('productDetail.email')}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Seller Location Map */}
            {sellerProfile?.user?.location && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t('productDetail.sellerLocation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-[hsl(var(--muted-foreground))]">
                      <p className="mb-2">📍 {sellerProfile.user.location.name || t('productDetail.locationNotSpecified')}</p>
                      <p className="text-sm">{t('productDetail.googleMapIntegrationComingSoon')}</p>
                      {/* TODO: Integrate Google Maps API */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Purchase & Seller Info */}
          <div className="space-y-6">
            {/* Purchase Section */}
            <Card className="border-0 shadow-lg sticky top-6">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-[hsl(var(--primary))] mb-6">
                  {t('homepage.pricePrefix')} {pricePerUnit.toLocaleString()}
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    {t('productDetail.quantity')}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-10 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors flex items-center justify-center font-semibold"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-semibold"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors flex items-center justify-center font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 mb-6 pb-6 border-b border-[hsl(var(--border))]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">{t('productDetail.pricePerUnit')}:</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{t('homepage.pricePrefix')} {pricePerUnit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">{t('productDetail.quantity')}:</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{quantity}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[hsl(var(--muted-foreground))]">{t('productDetail.shipping')}:</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">{t('homepage.pricePrefix')} {shippingCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-[hsl(var(--border))] mt-2">
                    <span className="text-[hsl(var(--foreground))]">{t('productDetail.totalPrice')}:</span>
                    <span className="text-[hsl(var(--primary))]">{t('homepage.pricePrefix')} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white h-12 text-base font-semibold shadow-md"
                  >
                    🛒 {t('productDetail.addToCart')}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold shadow-md"
                  >
                    💳 {t('productDetail.buyNow')}
                  </Button>
                  <Link to="/cart" className="block w-full">
                    <Button variant="outline" className="w-full h-11">
                      {t('productDetail.viewCart')}
                    </Button>
                  </Link>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Buyer-Seller Messaging Modal */}
        {showMessageModal && ad && user && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <CardHeader className="flex items-center justify-between flex-shrink-0 border-b border-[hsl(var(--border))]">
                <CardTitle>Contact Seller: {ad.seller?.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowMessageModal(false)}>✕</Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
                {loadingMessages ? (
                  <p className="text-center text-[hsl(var(--muted-foreground))]">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                    No messages yet. Start the conversation below.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_type === 'buyer'
                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                              : 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardContent className="flex-shrink-0 border-t border-[hsl(var(--border))] pt-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('productDetail.typeYourMessage')}
                    className="flex-1 px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    disabled={sendingMessage}
                  />
                  <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdDetailPage;
