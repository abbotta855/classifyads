import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { publicAuctionAPI } from '../utils/api';
import axios from 'axios';

function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    loadAuction();
  }, [id]);

  useEffect(() => {
    if (auction) {
      // Update time remaining every second
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [auction]);

  useEffect(() => {
    if (auction) {
      loadBidHistory();
    }
  }, [auction]);

  const loadAuction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicAuctionAPI.getAuction(id);
      setAuction(response.data);
      setBidAmount((response.data.next_minimum_bid || response.data.starting_price || 0).toFixed(2));
      
      // Track click
      try {
        await publicAuctionAPI.trackClick(id);
      } catch (err) {
        // Silently fail
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load auction');
      console.error('Error loading auction:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBidHistory = async () => {
    if (!auction) return;
    try {
      const response = await publicAuctionAPI.getBidHistory(auction.id);
      setBidHistory(response.data.bids || []);
    } catch (err) {
      console.error('Error loading bid history:', err);
    }
  };

  const updateTimeRemaining = () => {
    if (!auction) return;
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const diff = endTime - now;

    if (diff <= 0) {
      setTimeRemaining('Ended');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${seconds}s`);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setBidError('');
    setPlacingBid(true);

    try {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        setBidError('Please enter a valid bid amount');
        setPlacingBid(false);
        return;
      }

      const response = await publicAuctionAPI.placeBid(auction.id, amount);
      
      // Reload auction to get updated bid info
      await loadAuction();
      await loadBidHistory();
      
      // Reset bid amount to next minimum
      setBidAmount((response.data.auction?.next_minimum_bid || amount + auction.bid_increment).toFixed(2));
      
      alert('Bid placed successfully!');
    } catch (err) {
      setBidError(err.response?.data?.error || 'Failed to place bid');
      if (err.response?.data?.minimum_bid) {
        setBidAmount(err.response.data.minimum_bid.toFixed(2));
      }
    } finally {
      setPlacingBid(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // TODO: Implement buy now functionality
    alert('Buy Now functionality coming soon!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading auction...</div>
        </div>
      </Layout>
    );
  }

  if (error || !auction) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error || 'Auction not found'}</p>
            <Button onClick={() => navigate('/auctions')}>Back to Auctions</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = auction.images || [auction.image || 'https://via.placeholder.com/1200x1200?text=No+Image'];
  const isActive = auction.is_active && auction.status === 'active';
  const canBid = isActive && user && user.id !== auction.user_id;
  const isWinning = auction.user_bid_status?.is_winning;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Title & Info */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {auction.category && (
                    <div>
                      <span className="font-medium">Category:</span> {auction.category}
                      {auction.subcategory && <span> &gt; {auction.subcategory}</span>}
                    </div>
                  )}
                  {auction.location && (
                    <div>
                      <span>📍</span> {auction.location}
                    </div>
                  )}
                  <div>
                    <span>👁️</span> {auction.views || 0} views
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Image Gallery */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={images[selectedImageIndex]}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                  {!isActive && (
                    <div className="absolute top-6 right-6 bg-red-500/90 text-white px-6 py-3 rounded-full font-semibold text-sm">
                      {auction.status === 'ended' ? 'ENDED' : auction.status.toUpperCase()}
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
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
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${auction.title} - Image ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{auction.description || 'No description provided.'}</p>
              </CardContent>
            </Card>

            {/* Bid History */}
            {bidHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bid History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bidHistory.map((bid) => (
                      <div key={bid.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <p className="font-medium">{bid.user?.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-500">{new Date(bid.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">Rs. {bid.bid_amount.toLocaleString()}</p>
                          {bid.is_winning && <p className="text-xs text-green-600">Winning</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Bid */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Current Bid</label>
                  <p className="text-3xl font-bold text-blue-600">
                    Rs. {(auction.current_bid || auction.starting_price || 0).toLocaleString()}
                  </p>
                </div>

                {/* Starting Price */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Starting Price</label>
                  <p className="text-lg font-semibold">Rs. {auction.starting_price?.toLocaleString()}</p>
                </div>

                {/* Time Remaining */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Time Remaining</label>
                  <p className="text-lg font-semibold text-red-600">{timeRemaining || auction.time_remaining}</p>
                </div>

                {/* Bid Count */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bids</label>
                  <p className="text-lg font-semibold">{auction.bid_count || 0} bid{auction.bid_count !== 1 ? 's' : ''}</p>
                </div>

                {/* Reserve Price (if set) */}
                {auction.reserve_price && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Reserve Price</label>
                    <p className="text-lg font-semibold">Rs. {auction.reserve_price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">(Not met yet)</p>
                  </div>
                )}

                {/* User Bid Status */}
                {user && auction.user_bid_status && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    {auction.user_bid_status.has_bid ? (
                      <>
                        <p className="text-sm font-medium">Your Bid</p>
                        <p className="text-lg font-bold text-blue-600">
                          Rs. {auction.user_bid_status.bid_amount.toLocaleString()}
                        </p>
                        {isWinning ? (
                          <p className="text-sm text-green-600 font-medium">✓ You are winning!</p>
                        ) : (
                          <p className="text-sm text-red-600 font-medium">You have been outbid</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">You haven't placed a bid yet</p>
                    )}
                  </div>
                )}

                {/* Place Bid Form */}
                {canBid && (
                  <form onSubmit={handlePlaceBid} className="space-y-3 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Bid</label>
                      <Input
                        type="number"
                        step="0.01"
                        min={auction.next_minimum_bid || auction.starting_price}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min: Rs. ${(auction.next_minimum_bid || auction.starting_price).toLocaleString()}`}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum bid: Rs. {(auction.next_minimum_bid || auction.starting_price).toLocaleString()}
                      </p>
                    </div>
                    {bidError && (
                      <p className="text-sm text-red-600">{bidError}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={placingBid || !bidAmount}
                      className="w-full"
                    >
                      {placingBid ? 'Placing Bid...' : 'Place Bid'}
                    </Button>
                  </form>
                )}

                {/* Buy Now Button */}
                {canBid && auction.buy_now_price && (
                  <Button
                    onClick={handleBuyNow}
                    variant="outline"
                    className="w-full"
                  >
                    Buy Now: Rs. {auction.buy_now_price.toLocaleString()}
                  </Button>
                )}

                {/* Not Logged In */}
                {!user && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm mb-2">Please log in to place a bid</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                      Log In
                    </Button>
                  </div>
                )}

                {/* Seller Cannot Bid */}
                {user && user.id === auction.user_id && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">You cannot bid on your own auction</p>
                  </div>
                )}

                {/* Auction Ended */}
                {!isActive && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">This auction has ended</p>
                    {auction.winner && (
                      <p className="text-sm mt-1">Winner: {auction.winner.name}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            {auction.seller && (
              <Card>
                <CardHeader>
                  <CardTitle>Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      {auction.seller.profile_picture ? (
                        <img src={auction.seller.profile_picture} alt={auction.seller.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg">{auction.seller.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{auction.seller.name}</p>
                    </div>
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

export default AuctionDetailPage;

