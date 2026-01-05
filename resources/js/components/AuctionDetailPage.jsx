import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { publicAuctionAPI, ratingAPI, publicProfileAPI } from '../utils/api';
import { Link } from 'react-router-dom';
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
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [useProxyBidding, setUseProxyBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [showAllBids, setShowAllBids] = useState(false); // Toggle to show all bids or just last 5
  const [timeRemaining, setTimeRemaining] = useState('');
  const [statusUpdateInterval, setStatusUpdateInterval] = useState(10); // Dynamic interval for status updates
  const statusCheckInProgress = useRef(false); // Prevent multiple simultaneous status checks
  
  // Finance calculator state
  const [showFinanceCalculator, setShowFinanceCalculator] = useState(false);
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeMonths, setFinanceMonths] = useState(12);
  
  // Seller information state
  const [sellerRating, setSellerRating] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);

  useEffect(() => {
    loadAuction();
  }, [id]);

  useEffect(() => {
    if (auction) {
      // Update time remaining every second
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [auction]);

  // Real-time status updates - same logic as admin panel
  // Updates immediately when start_time or end_time is reached
  useEffect(() => {
    if (!auction) return;
    
    // Only poll if auction is pending or active
    const shouldPoll = auction.status === 'pending' || auction.status === 'active';
    if (!shouldPoll) return;

    // Calculate initial interval based on time until start/end
    const calculateInitialInterval = () => {
      const now = new Date();
      const startTime = new Date(auction.start_time);
      const endTime = new Date(auction.end_time);
      
      let secondsUntilChange = null;
      if (auction.status === 'pending') {
        // Check if start time has already passed (status might not be updated yet)
        if (startTime <= now) {
          return 1; // Start time passed, poll every second aggressively
        }
        secondsUntilChange = Math.max(1, Math.floor((startTime - now) / 1000));
      } else if (auction.status === 'active') {
        // Check if end time has already passed (status might not be updated yet)
        if (endTime <= now) {
          return 1; // End time passed, poll every second aggressively
        }
        secondsUntilChange = Math.max(1, Math.floor((endTime - now) / 1000));
      }
      
      if (secondsUntilChange !== null) {
        // Be more aggressive - poll every second if within 2 minutes
        if (secondsUntilChange <= 120) return 1;  // 1 second if < 2 min
        if (secondsUntilChange <= 300) return 5; // 5 seconds if < 5 min
        return 10; // 10 seconds otherwise
      }
      return 1; // Default to 1 second for immediate updates
    };

    let statusUpdateTimer = null;
    let currentInterval = calculateInitialInterval();
    setStatusUpdateInterval(currentInterval);

    const updateAuctionStatus = async () => {
      // Stop polling if auction already in terminal state
      if (auction.status === 'ended' || auction.status === 'completed') {
        if (statusUpdateTimer) {
          clearInterval(statusUpdateTimer);
          statusUpdateTimer = null;
        }
        return;
      }

      try {
        const response = await publicAuctionAPI.getAuctionStatuses([auction.id]);
        const statuses = response.data.statuses || {};
        const recommendedInterval = response.data.recommended_interval || 10;
        
        // Update recommended interval for dynamic polling
        if (recommendedInterval !== currentInterval) {
          currentInterval = recommendedInterval;
          setStatusUpdateInterval(recommendedInterval);
          
          // Restart timer with new interval
          if (statusUpdateTimer) {
            clearInterval(statusUpdateTimer);
          }
          statusUpdateTimer = setInterval(updateAuctionStatus, recommendedInterval * 1000);
        }
        
        // Update auction status if it changed
        const newStatus = statuses[auction.id];
        if (newStatus && newStatus !== auction.status) {
          // Update local state instead of reloading
          console.log(`Auction status changed from ${auction.status} to ${newStatus} - updating local state...`);
          setAuction(prev => ({ ...prev, status: newStatus }));
          if (newStatus === 'ended' || newStatus === 'completed') {
            if (statusUpdateTimer) {
              clearInterval(statusUpdateTimer);
              statusUpdateTimer = null;
            }
          }
        }
      } catch (error) {
        // Silently fail - don't break the UI
        console.warn('Failed to update auction status:', error);
      }
    };
    
    // Initial update immediately
    updateAuctionStatus();
    
    // Set up polling with calculated initial interval
    if (currentInterval > 0) {
      statusUpdateTimer = setInterval(updateAuctionStatus, currentInterval * 1000);
    }
    
    return () => {
      if (statusUpdateTimer) {
        clearInterval(statusUpdateTimer);
      }
    };
  }, [auction?.id, auction?.status, auction?.start_time, auction?.end_time]);

  useEffect(() => {
    if (auction) {
      loadBidHistory();
    }
  }, [auction]);

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      alert('Payment completed successfully!');
      // Remove payment param from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Reload auction to show updated status
      loadAuction();
    } else if (paymentStatus === 'error') {
      const message = urlParams.get('message') || 'Payment failed';
      alert(`Payment error: ${message}`);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
    
    // Don't show time remaining if auction has ended or is completed
    if (auction.status === 'ended' || auction.status === 'completed') {
      setTimeRemaining('Ended');
      return;
    }
    
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    
    // For pending auctions, show time until start
    if (auction.status === 'pending') {
      const diff = startTime - now;
      
      // If start time has passed but status is still pending, trigger immediate reload
      if (diff <= 0) {
        setTimeRemaining('Starting soon...');
        // Trigger immediate status check and reload (with debounce)
        if (!statusCheckInProgress.current) {
          statusCheckInProgress.current = true;
          // Force reload immediately - don't wait for status check
          // The backend statuses endpoint will update the database, but we should reload anyway
          console.log('Start time passed! Forcing immediate reload...');
          loadAuction().finally(() => {
            // Also check status to ensure database is updated
            publicAuctionAPI.getAuctionStatuses([auction.id])
              .then(response => {
                const statuses = response.data.statuses || {};
                const newStatus = statuses[auction.id];
                // If status changed after reload, reload again to get fresh data
                if (newStatus && newStatus !== 'pending' && newStatus !== auction.status) {
                  console.log(`Status updated to ${newStatus} - reloading again...`);
                  loadAuction();
                }
              })
              .catch(err => console.warn('Failed to check status:', err))
              .finally(() => {
                // Reset flag after 1 second to allow retry if needed
                setTimeout(() => {
                  statusCheckInProgress.current = false;
                }, 1000);
              });
          });
        }
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeRemaining(`Starts in: ${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`Starts in: ${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`Starts in: ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`Starts in: ${seconds}s`);
      }
      return;
    }
    
    // For active auctions, show time until end
    if (auction.status === 'active') {
      const diff = endTime - now;

      // If end time has passed but status is still active, trigger immediate reload
      if (diff <= 0) {
        setTimeRemaining('Ended');
        // Trigger immediate status check and reload (with debounce)
        if (!statusCheckInProgress.current) {
          statusCheckInProgress.current = true;
          // Force reload immediately - don't wait for status check
          console.log('End time passed! Forcing immediate reload...');
          loadAuction().finally(() => {
            // Also check status to ensure database is updated
            publicAuctionAPI.getAuctionStatuses([auction.id])
              .then(response => {
                const statuses = response.data.statuses || {};
                const newStatus = statuses[auction.id];
                // If status changed after reload, reload again to get fresh data
                if (newStatus && newStatus !== 'active' && newStatus !== auction.status) {
                  console.log(`Status updated to ${newStatus} - reloading again...`);
                  loadAuction();
                }
              })
              .catch(err => console.warn('Failed to check status:', err))
              .finally(() => {
                // Reset flag after 1 second to allow retry if needed
                setTimeout(() => {
                  statusCheckInProgress.current = false;
                }, 1000);
              });
          });
        }
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
      return;
    }
  };

  // Stop status polling when auction is ended/completed
  useEffect(() => {
    if (!auction) return;
    const isTerminal = auction.status === 'ended' || auction.status === 'completed';
    if (isTerminal) {
      // No-op here because the status polling effect below is terminal-aware
    }
  }, [auction]);

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

      // Client-side check for unusually high bids (more than 10x starting price)
      const startingPrice = auction.starting_price || 0;
      const maxReasonableBid = startingPrice * 10;
      
      if (amount > maxReasonableBid && startingPrice > 0) {
        const multiplier = (amount / startingPrice).toFixed(1);
        const confirmed = window.confirm(
          `Warning: Your bid of Rs. ${amount.toLocaleString()} is ${multiplier}x the starting price (Rs. ${startingPrice.toLocaleString()}).\n\n` +
          `This seems unusually high. Are you sure you want to proceed?`
        );
        
        if (!confirmed) {
          setPlacingBid(false);
          return;
        }
      }

      // Prepare max_bid_amount if proxy bidding is enabled
      const maxBid = useProxyBidding && maxBidAmount 
        ? parseFloat(maxBidAmount) 
        : null;
      
      // Validate max bid if provided
      if (maxBid !== null) {
        if (isNaN(maxBid) || maxBid <= amount) {
          setBidError('Maximum bid must be greater than your bid amount');
          setPlacingBid(false);
          return;
        }
      }
      
      const response = await publicAuctionAPI.placeBid(auction.id, amount, maxBid);
      
      // Check if backend also requires confirmation
      if (response.data?.requires_confirmation) {
        const confirmed = window.confirm(response.data.message);
        if (!confirmed) {
          setPlacingBid(false);
          return;
        }
        // If confirmed, place the bid again (backend will accept it this time)
        // Actually, the backend already accepted it, so we can continue
      }
      
      console.log('Bid placed response:', response.data);
      
      // Update auction state immediately with response data
      if (response.data?.auction) {
        const updatedAuction = response.data.auction;
        // Ensure bid_count is set correctly - use the value from response or increment
        const newBidCount = updatedAuction.bid_count !== undefined && updatedAuction.bid_count !== null
          ? updatedAuction.bid_count 
          : (auction.bid_count || 0) + 1;
        
        console.log('Updating auction state with bid_count:', newBidCount);
        
        setAuction(prevAuction => {
          const updated = {
            ...prevAuction,
            ...updatedAuction,
            bid_count: newBidCount,
            current_bid: updatedAuction.current_bid_price || updatedAuction.current_bid || prevAuction?.current_bid,
            current_bid_price: updatedAuction.current_bid_price || updatedAuction.current_bid || prevAuction?.current_bid_price,
          };
          console.log('Updated auction state:', updated);
          return updated;
        });
      }
      
      // Reload auction to get fully updated bid info (with a small delay to ensure DB is updated)
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to ensure DB commit
      await loadAuction();
      await loadBidHistory();
      
      // Reset bid amount to next minimum
      setBidAmount((response.data.auction?.next_minimum_bid || amount + auction.bid_increment).toFixed(2));
      
      // Reset proxy bidding fields
      setUseProxyBidding(false);
      setMaxBidAmount('');
      
    } catch (err) {
      setBidError(err.response?.data?.error || 'Failed to place bid');
      if (err.response?.data?.minimum_bid) {
        setBidAmount(err.response.data.minimum_bid.toFixed(2));
      }
    } finally {
      setPlacingBid(false);
    }
  };

  const handlePayNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (auction.winner_id !== user.id) {
      alert('You are not the winner of this auction');
      return;
    }

    if (auction.payment_completed_at) {
      alert('Payment already completed for this auction');
      return;
    }

    setPlacingBid(true);
    setBidError('');

    try {
      // Initiate payment for winning bid
      const paymentResponse = await publicAuctionAPI.initiatePayment(id, 'winning_bid');
      
      if (paymentResponse.data && paymentResponse.data.approval_url) {
        // Redirect to PayPal
        window.location.href = paymentResponse.data.approval_url;
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (err) {
      setBidError(err.response?.data?.error || 'Failed to initiate payment');
      console.error('Error initiating payment:', err);
      setPlacingBid(false);
    }
  };

  const cancelingBidRef = useRef(false); // Prevent duplicate cancellation requests

  const handleCancelBid = async (bidId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Prevent duplicate requests
    if (cancelingBidRef.current) {
      console.log('Bid cancellation already in progress');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this bid? This action cannot be undone.')) {
      return;
    }

    cancelingBidRef.current = true;

    try {
      const response = await publicAuctionAPI.cancelBid(bidId);
      
      if (response.data?.message) {
        alert(response.data.message);
      }
      
      // Reload auction and bid history to reflect changes
      // Use a small delay to ensure backend transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadAuction();
      await loadBidHistory();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to cancel bid';
      alert(errorMessage);
      console.error('Error cancelling bid:', err);
      
      // Still reload to get current state
      await loadAuction();
      await loadBidHistory();
    } finally {
      cancelingBidRef.current = false;
    }
  };

  const loadSellerRating = async () => {
    if (!auction?.user_id) return;
    
    try {
      const response = await ratingAPI.getSellerRatings(auction.user_id);
      if (response.data && response.data.total_ratings > 0) {
        // Calculate criteria averages from ratings if available
        const criteria = {};
        if (response.data.ratings && Array.isArray(response.data.ratings) && response.data.ratings.length > 0) {
          const allCriteria = {};
          response.data.ratings.forEach(rating => {
            if (rating.criteria_scores && Array.isArray(rating.criteria_scores)) {
              rating.criteria_scores.forEach(cs => {
                const criterionName = cs.criteria_name || cs.criteria?.name;
                if (criterionName) {
                  if (!allCriteria[criterionName]) {
                    allCriteria[criterionName] = [];
                  }
                  allCriteria[criterionName].push(cs.score);
                }
              });
            }
          });
          
          // Calculate averages
          Object.keys(allCriteria).forEach(criterionName => {
            const scores = allCriteria[criterionName];
            if (scores.length > 0) {
              criteria[criterionName] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            }
          });
        }
        
        setSellerRating({
          average: response.data.average_rating,
          total: response.data.total_ratings,
          criteria: criteria,
        });
      }
    } catch (err) {
      console.error('Error loading seller rating:', err);
    }
  };

  const loadSellerProfile = async () => {
    if (!auction?.user_id) return;
    
    try {
      const response = await publicProfileAPI.getProfile(auction.user_id);
      setSellerProfile(response.data);
    } catch (err) {
      console.error('Error loading seller profile:', err);
    }
  };

  const calculateMonthlyPayment = () => {
    if (!auction.financing_terms || !financeAmount) return null;
    
    const principal = parseFloat(financeAmount);
    const annualRate = auction.financing_terms.interest_rate || 0;
    const months = parseInt(financeMonths);
    
    if (principal <= 0 || months <= 0) return null;
    
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    
    return monthlyPayment;
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!auction.buy_now_price) {
      alert('Buy Now is not available for this auction');
      return;
    }

    if (!window.confirm(`Are you sure you want to buy this auction for Rs. ${auction.buy_now_price.toLocaleString()}? This will end the auction immediately and redirect you to payment.`)) {
      return;
    }

    setPlacingBid(true);
    setBidError('');

    try {
      // First, end the auction and set winner
      const buyNowResponse = await publicAuctionAPI.buyNow(id);
      
      if (!buyNowResponse.data || !buyNowResponse.data.auction) {
        throw new Error('Failed to process Buy Now');
      }

      // Then initiate payment
      const paymentResponse = await publicAuctionAPI.initiatePayment(id, 'buy_now');
      const paymentData = paymentResponse?.data || {};

      // Wallet-paid (no external redirect)
      if (paymentData.wallet_paid) {
        await loadAuction(); // refresh status to completed/paid
        setPlacingBid(false);
        return;
      }

      // Demo mode: backend completes immediately, no redirect
      if (paymentData.demo_mode) {
        await loadAuction(); // refresh status to completed/paid
        setPlacingBid(false);
        return;
      }

      // Normal PayPal flow
      if (paymentData.approval_url) {
        window.location.href = paymentData.approval_url;
        return;
      }

      throw new Error(paymentData.error || 'Failed to initiate payment');
    } catch (err) {
      if (err.response?.status === 402 && err.response?.data?.needs_top_up) {
        const data = err.response.data;
        setBidError(`Insufficient wallet balance. Needed: ${data.required}, Balance: ${data.balance}, Shortfall: ${data.shortfall}. Please add funds and try again.`);
        // Redirect user to wallet/e-wallet page to add funds
        setTimeout(() => {
          navigate('/user_dashboard/e-wallet');
        }, 500);
      } else {
        setBidError(err.response?.data?.error || 'Failed to process Buy Now');
      }
      console.error('Error buying now:', err);
      setPlacingBid(false);
    }
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
  // Use calculated status from API (which is based on actual times)
  const isActive = auction.status === 'active';
  const isEnded = auction.status === 'ended' || auction.status === 'completed';
  const isPending = auction.status === 'pending';
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
                    <div className={`absolute top-6 right-6 text-white px-6 py-3 rounded-full font-semibold text-sm ${
                      isEnded ? 'bg-gray-500/90' : 'bg-yellow-500/90'
                    }`}>
                      {isEnded ? 'ENDED' : auction.status.toUpperCase()}
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
                  <div className="space-y-2">
                    {/* Show last 5 bids by default, or all if showAllBids is true */}
                    {(showAllBids ? bidHistory : bidHistory.slice(0, 5)).map((bid) => {
                      // Check if this bid can be cancelled
                      // Can cancel if: bid is user's own AND (within 5 minutes OR not outbid)
                      const bidTime = new Date(bid.created_at);
                      const timeSinceBid = (Date.now() - bidTime.getTime()) / (1000 * 60); // minutes
                      const canCancel = user && 
                        bid.user?.id === user.id && 
                        (timeSinceBid <= 5 || bid.is_winning) &&
                        !cancelingBidRef.current; // Disable if cancellation in progress
                      
                      return (
                        <div key={bid.id} className="flex justify-between items-center p-2 border-b">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{bid.user?.name || 'Anonymous'}</p>
                              {bid.user?.id === user?.id && (
                                <span className="text-xs text-gray-500">(You)</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{new Date(bid.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="font-bold text-blue-600">Rs. {bid.bid_amount.toLocaleString()}</p>
                              {bid.is_winning && <p className="text-xs text-green-600">Winning</p>}
                            </div>
                            {canCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBid(bid.id)}
                                disabled={cancelingBidRef.current}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {cancelingBidRef.current ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Show More / Show Less button */}
                  {bidHistory.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllBids(!showAllBids)}
                        className="w-full"
                      >
                        {showAllBids 
                          ? `Show Less (Showing ${bidHistory.length} bids)` 
                          : `Show More (${bidHistory.length - 5} more bids)`
                        }
                      </Button>
                    </div>
                  )}
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

                {/* Reserve Price Status (if set) - Hide amount, show only met/not met */}
                {auction.reserve_price && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Reserve Price</label>
                    {(() => {
                      // Use current_bid_price if available, otherwise fall back to current_bid
                      const currentBid = auction.current_bid_price ?? auction.current_bid ?? auction.starting_price ?? 0;
                      const reservePrice = auction.reserve_price ?? 0;
                      const isMet = currentBid >= reservePrice;
                      return isMet ? (
                        <p className="text-lg font-semibold text-green-600">✓ Reserve Met</p>
                      ) : (
                        <p className="text-lg font-semibold text-orange-600">Reserve Not Met</p>
                      );
                    })()}
                    <p className="text-xs text-gray-500">Reserve price is hidden until met</p>
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
                    
                    {/* Proxy Bidding Option */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useProxyBidding}
                          onChange={(e) => {
                            setUseProxyBidding(e.target.checked);
                            if (!e.target.checked) {
                              setMaxBidAmount('');
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Use Proxy Bidding (Auto-bid up to maximum)</span>
                      </label>
                      
                      {useProxyBidding && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Maximum Bid Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            min={bidAmount ? parseFloat(bidAmount) + 0.01 : auction.next_minimum_bid || auction.starting_price}
                            value={maxBidAmount}
                            onChange={(e) => setMaxBidAmount(e.target.value)}
                            placeholder={`Max: Rs. ${((parseFloat(bidAmount) || auction.next_minimum_bid || auction.starting_price) * 2).toLocaleString()}`}
                            className="text-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            System will automatically bid on your behalf up to this amount
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {bidError && (
                      <p className="text-sm text-red-600">{bidError}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={placingBid || !bidAmount || (useProxyBidding && !maxBidAmount)}
                      className="w-full"
                    >
                      {placingBid ? 'Placing Bid...' : useProxyBidding ? 'Place Proxy Bid' : 'Place Bid'}
                    </Button>
                  </form>
                )}

                {/* Buy Now Button */}
                {canBid && 
                 auction.buy_now_price && 
                 isActive && 
                 (!auction.current_bid || auction.current_bid < auction.buy_now_price) && (
                  <Button
                    onClick={handleBuyNow}
                    disabled={placingBid}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-3"
                  >
                    {placingBid ? 'Processing...' : `Buy Now: Rs. ${auction.buy_now_price.toLocaleString()}`}
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

                {/* Auction Status Messages */}
                {isEnded && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium">This auction has ended</p>
                    {auction.winner && (
                      <p className="text-sm mt-1">Winner: {auction.winner.name}</p>
                    )}
                    {/* Pay Now Button for Winner */}
                    {user && 
                     auction.winner_id === user.id && 
                     !auction.payment_completed_at && 
                     auction.status === 'ended' && (
                      <Button
                        onClick={handlePayNow}
                        disabled={placingBid}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-3"
                      >
                        {placingBid ? 'Processing...' : `Pay Now: Rs. ${(auction.current_bid_price || auction.starting_price).toLocaleString()}`}
                      </Button>
                    )}
                    {/* Payment Completed */}
                    {auction.payment_completed_at && (
                      <p className="text-sm text-green-600 font-medium">✓ Payment Completed</p>
                    )}
                  </div>
                )}
                
                {/* Auction Completed */}
                {auction.status === 'completed' && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700">✓ Auction completed and paid</p>
                    {auction.winner && (
                      <p className="text-sm mt-1">Winner: {auction.winner.name}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Information - Detailed */}
            {auction.seller && (
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seller Name & Rating */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                      {auction.seller.profile_picture ? (
                        <img
                          src={auction.seller.profile_picture}
                          alt={auction.seller.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-500 font-semibold">
                          {auction.seller.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {auction.seller && auction.seller.id ? (
                        <Link
                          to={`/profile/${auction.seller.id}`}
                          className="block hover:underline"
                        >
                          <h3 className="font-semibold text-lg text-[hsl(var(--foreground))] truncate">
                            {auction.seller.name}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-lg text-[hsl(var(--foreground))] truncate">
                          {auction.seller?.name || 'Unknown Seller'}
                        </h3>
                      )}
                      {sellerRating && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {sellerRating.average?.toFixed(1) || '0.0'} ({sellerRating.total || 0} reviews)
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
                          Mobile
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
                          Email
                        </label>
                        <p className="text-sm text-[hsl(var(--foreground))]">{sellerProfile.user.email}</p>
                      </div>
                    )}

                    {/* Overall Rating */}
                    {sellerRating && sellerRating.criteria && Object.keys(sellerRating.criteria).length > 0 && (
                      <div>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-2">
                          Overall Rating
                        </label>
                        <div className="space-y-1">
                          {Object.entries(sellerRating.criteria).map(([criterion, rating]) => (
                            <div key={criterion} className="flex items-center justify-between text-sm">
                              <span className="text-[hsl(var(--foreground))] capitalize">
                                {criterion.replace('_', ' ')}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                <span className="font-semibold">{rating?.toFixed(1) || '0.0'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                    {auction.seller && auction.seller.id ? (
                      <>
                        <Link
                          to={`/profile/${auction.seller.id}`}
                          className="block"
                        >
                          <Button variant="outline" className="w-full">
                            View Seller Profile →
                          </Button>
                        </Link>
                        {/* Contact to Seller */}
                        {user && user.id !== auction.user_id ? (
                          <Button
                            onClick={() => {
                              navigate(`/user_dashboard/inbox?auction_id=${auction.id}`);
                            }}
                            className="w-full"
                          >
                            Contact Seller
                          </Button>
                        ) : !user ? (
                          <Button
                            onClick={() => navigate('/login')}
                            className="w-full"
                          >
                            Login to Contact Seller
                          </Button>
                        ) : user.id === auction.user_id ? (
                          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
                            You are the seller
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
                        Seller profile is no longer available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Options Section */}
            <Card className="border-2 border-red-500">
              <CardHeader>
                <CardTitle>Transaction Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pickup Options */}
                <div>
                  <h3 className="font-semibold mb-2">Pick Up Option</h3>
                  <div className="space-y-2">
                    {auction.self_pickup && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Self pick up</span>
                      </div>
                    )}
                    {auction.seller_delivery && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Seller can delivery</span>
                      </div>
                    )}
                    {!auction.self_pickup && !auction.seller_delivery && (
                      <p className="text-sm text-gray-600">
                        Buyer must pick from: {auction.location || 'ad posted address'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Options */}
                <div>
                  <h3 className="font-semibold mb-2">Payment Option</h3>
                  <div className="space-y-2">
                    {auction.payment_methods && auction.payment_methods.length > 0 ? (
                      auction.payment_methods.map((method, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="capitalize">{method.replace('_', ' ')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Bank Transfer</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Finance Option */}
                {auction.financing_available && (
                  <div>
                    <h3 className="font-semibold mb-2">Finance Option</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Financial institution with finance calculator to pay back each month.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowFinanceCalculator(true)}
                      className="w-full"
                    >
                      Calculate Monthly Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Finance Calculator Modal */}
      {showFinanceCalculator && auction.financing_available && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Finance Calculator</h2>
              <button
                onClick={() => {
                  setShowFinanceCalculator(false);
                  setFinanceAmount('');
                  setFinanceMonths(12);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loan Amount (Rs.)</label>
                <Input
                  type="number"
                  value={financeAmount}
                  onChange={(e) => setFinanceAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Loan Term (Months): {financeMonths}
                </label>
                <input
                  type="range"
                  min={auction.financing_terms?.min_months || 6}
                  max={auction.financing_terms?.max_months || 36}
                  value={financeMonths}
                  onChange={(e) => setFinanceMonths(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{auction.financing_terms?.min_months || 6} months</span>
                  <span>{auction.financing_terms?.max_months || 36} months</span>
                </div>
              </div>
              
              {auction.financing_terms?.institution && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <span className="font-semibold">Financial Institution:</span> {auction.financing_terms.institution}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Interest Rate:</span> {auction.financing_terms.interest_rate}% APR
                  </p>
                </div>
              )}
              
              {financeAmount && calculateMonthlyPayment() && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rs. {calculateMonthlyPayment().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Total amount: Rs. {(calculateMonthlyPayment() * financeMonths).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              
              <Button
                onClick={() => {
                  setShowFinanceCalculator(false);
                  setFinanceAmount('');
                  setFinanceMonths(12);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AuctionDetailPage;

