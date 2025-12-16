import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ebookAPI, ratingAPI } from '../utils/api';
import axios from 'axios';

function EbookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPurchaseCode, setReviewPurchaseCode] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [ratingCriteria, setRatingCriteria] = useState([]);
  const [criteriaScores, setCriteriaScores] = useState({});

  useEffect(() => {
    // Check for payment success/cancel messages from URL
    const paymentStatus = searchParams.get('payment');
    const verificationCode = searchParams.get('code');
    
    if (paymentStatus === 'success' && verificationCode) {
      setPaymentMessage({
        type: 'success',
        message: `Payment successful! Your verification code is: ${verificationCode}`,
      });
      // Clear URL parameters
      navigate(`/ebooks/${id}`, { replace: true });
    } else if (paymentStatus === 'error') {
      setPaymentMessage({
        type: 'error',
        message: searchParams.get('message') || 'Payment failed. Please try again.',
      });
      navigate(`/ebooks/${id}`, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage({
        type: 'info',
        message: 'Payment was cancelled.',
      });
      navigate(`/ebooks/${id}`, { replace: true });
    }

    fetchEbook();
    if (user) {
      checkExistingReview();
    }
  }, [id, user]);

  useEffect(() => {
    if (ebook) {
      fetchAllReviews();
    }
  }, [ebook]);

  const fetchEbook = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ebookAPI.getEbook(id);
      setEbook(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load eBook');
      console.error('Error loading eBook:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReviews = async () => {
    if (!ebook) return;
    setLoadingReviews(true);
    try {
      const response = await axios.get(`/api/ratings/seller/${ebook.user_id}`, { params: { ebook_id: id } });
      setAllReviews(response.data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkExistingReview = async () => {
    try {
      const response = await axios.get(`/api/ratings/check/0`, { params: { ebook_id: id } });
      if (response.data.has_rated) {
        setExistingReview(response.data.rating);
        setReviewRating(response.data.rating.rating);
        setReviewComment(response.data.rating.comment || '');
        setReviewPurchaseCode(response.data.rating.purchase_code || '');
        
        // Load criteria scores if available
        if (response.data.rating.criteria_scores) {
          const scores = {};
          response.data.rating.criteria_scores.forEach(cs => {
            scores[cs.rating_criteria_id] = cs.score;
          });
          setCriteriaScores(scores);
        }
      }
    } catch (err) {
      console.error('Error checking existing review:', err);
    }
  };

  const loadRatingCriteria = async () => {
    try {
      const response = await axios.get('/api/ratings/criteria', { params: { type: 'ebook' } });
      setRatingCriteria(response.data || []);
      // Initialize criteria scores with default value of 5
      const initialScores = {};
      (response.data || []).forEach(c => {
        initialScores[c.id] = criteriaScores[c.id] || 5;
      });
      setCriteriaScores(initialScores);
    } catch (err) {
      console.error('Error loading rating criteria:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/ebooks/${id}` } });
      return;
    }

    if (!ebook?.is_purchased) {
      setPaymentMessage({
        type: 'error',
        message: 'You must purchase this eBook before leaving a review.',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const criteriaScoresArray = Object.keys(criteriaScores).map(criteriaId => ({
        criteria_id: parseInt(criteriaId),
        score: criteriaScores[criteriaId],
      }));

      const data = {
        ebook_id: id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
        criteria_scores: criteriaScoresArray,
        purchase_code: reviewPurchaseCode.trim() || ebook.verification_code || null,
      };

      if (existingReview) {
        await ratingAPI.updateRating(existingReview.id, data);
      } else {
        await ratingAPI.submitRating(data);
      }

      // Refresh eBook data and reviews
      await fetchEbook();
      await fetchAllReviews();
      await checkExistingReview();
      
      setShowReviewForm(false);
      setPaymentMessage({
        type: 'success',
        message: existingReview ? 'Review updated successfully!' : 'Review submitted successfully!',
      });
    } catch (err) {
      setPaymentMessage({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/ebooks/${id}` } });
      return;
    }

    setPurchasing(true);
    try {
      const response = await ebookAPI.initiatePayment(id);
      if (response.data.approval_url) {
        // Redirect to PayPal
        window.location.href = response.data.approval_url;
      } else {
        setPaymentMessage({
          type: 'error',
          message: 'Failed to initiate payment. Please try again.',
        });
      }
    } catch (err) {
      setPaymentMessage({
        type: 'error',
        message: err.response?.data?.error || 'Failed to initiate payment. Please try again.',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/ebooks/${id}` } });
      return;
    }

    if (!ebook?.is_purchased) {
      setPaymentMessage({
        type: 'error',
        message: 'You must purchase this eBook before downloading.',
      });
      return;
    }

    setDownloading(true);
    try {
      const response = await ebookAPI.downloadEbook(id);
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ebook.file_name || `ebook-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setPaymentMessage({
        type: 'error',
        message: err.response?.data?.error || 'Failed to download eBook. Please try again.',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading eBook...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !ebook) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-500">{error || 'eBook not found'}</p>
              <Button onClick={() => navigate('/ebooks')} className="mt-4">
                Back to eBooks
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {paymentMessage && (
          <Card className={`mb-6 ${
            paymentMessage.type === 'success' ? 'bg-green-50 border-green-200' :
            paymentMessage.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <CardContent className="p-4">
              <p className={paymentMessage.type === 'success' ? 'text-green-800' :
                           paymentMessage.type === 'error' ? 'text-red-800' :
                           'text-blue-800'}>
                {paymentMessage.message}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cover and Purchase */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {ebook.cover_image ? (
                  <img
                    src={ebook.cover_image}
                    alt={ebook.title}
                    className="w-full rounded mb-4"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded mb-4 flex items-center justify-center">
                    <span className="text-gray-400">No Cover Image</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      Rs {parseFloat(ebook.price || 0).toFixed(2)}
                    </p>
                    {ebook.overall_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(ebook.overall_rating) ? 'text-yellow-500' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {ebook.overall_rating.toFixed(1)} ({ebook.purchase_count} purchases)
                        </span>
                      </div>
                    )}
                  </div>

                  {ebook.is_purchased ? (
                    <div className="space-y-2">
                      {ebook.verification_code && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3">
                            <p className="text-sm font-semibold text-green-800 mb-1">
                              Verification Code:
                            </p>
                            <p className="text-lg font-mono text-green-900">
                              {ebook.verification_code}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Use this code to verify your purchase when leaving a review.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full"
                      >
                        {downloading ? 'Downloading...' : 'Download eBook'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="w-full"
                    >
                      {purchasing ? 'Processing...' : 'Buy Now with PayPal'}
                    </Button>
                  )}

                  {ebook.book_type !== 'ebook' && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">Shipping Information:</p>
                      {ebook.shipping_cost && (
                        <p className="text-sm">Shipping: Rs {parseFloat(ebook.shipping_cost).toFixed(2)}</p>
                      )}
                      {ebook.delivery_time && (
                        <p className="text-sm">Delivery: {ebook.delivery_time}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{ebook.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ebook.writer && (
                  <div>
                    <p className="text-sm text-gray-600">Writer</p>
                    <p className="font-semibold">{ebook.writer}</p>
                  </div>
                )}

                {ebook.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="whitespace-pre-wrap">{ebook.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                  {ebook.language && (
                    <div>
                      <p className="text-sm text-gray-600">Language</p>
                      <p className="font-semibold">{ebook.language}</p>
                    </div>
                  )}
                  {ebook.pages && (
                    <div>
                      <p className="text-sm text-gray-600">Pages</p>
                      <p className="font-semibold">{ebook.pages}</p>
                    </div>
                  )}
                  {ebook.file_format && (
                    <div>
                      <p className="text-sm text-gray-600">Format</p>
                      <p className="font-semibold">{ebook.file_format}</p>
                    </div>
                  )}
                  {ebook.file_size && (
                    <div>
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="font-semibold">
                        {(ebook.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  {ebook.book_size && (
                    <div>
                      <p className="text-sm text-gray-600">Book Size</p>
                      <p className="font-semibold">{ebook.book_size}</p>
                    </div>
                  )}
                  {ebook.book_type && (
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold capitalize">{ebook.book_type.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>

                {ebook.publisher_name && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Publisher Information</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Name:</span> {ebook.publisher_name}</p>
                      {ebook.publisher_address && (
                        <p><span className="font-semibold">Address:</span> {ebook.publisher_address}</p>
                      )}
                      {ebook.publisher_email && (
                        <p><span className="font-semibold">Email:</span> {ebook.publisher_email}</p>
                      )}
                      {ebook.publisher_phone && (
                        <p><span className="font-semibold">Phone:</span> {ebook.publisher_phone}</p>
                      )}
                      {ebook.publisher_website && (
                        <p>
                          <span className="font-semibold">Website:</span>{' '}
                          <a href={ebook.publisher_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {ebook.publisher_website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {ebook.copyright_declared && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-green-600 font-semibold">
                      ✓ Copyright Declaration: The author/publisher declares this work is original and not copied from any source.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 space-y-6">
          {/* Write Review Section (for purchased users) */}
          {user && ebook?.is_purchased && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                {!showReviewForm ? (
                  <div className="space-y-4">
                    {existingReview ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          You have already submitted a review. Click below to update it.
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={i < existingReview.rating ? 'text-yellow-500' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {existingReview.comment ? existingReview.comment.substring(0, 100) + '...' : 'No comment'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Share your thoughts about this eBook with other readers.
                      </p>
                    )}
                    <Button
                      onClick={() => {
                        setShowReviewForm(true);
                        loadRatingCriteria();
                      }}
                      variant="outline"
                    >
                      {existingReview ? 'Update Review' : 'Write a Review'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Overall Rating */}
                    <div>
                      <Label>Overall Rating</Label>
                      <div className="flex items-center gap-2 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className={`text-3xl transition-colors ${
                              i < reviewRating ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-400`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{reviewRating} out of 5</span>
                      </div>
                    </div>

                    {/* Rating Criteria */}
                    {ratingCriteria.length > 0 && (
                      <div>
                        <Label>Additional Ratings</Label>
                        <div className="space-y-2 mt-2">
                          {ratingCriteria.map((criterion) => (
                            <div key={criterion.id} className="flex items-center justify-between">
                              <span className="text-sm">{criterion.name}</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCriteriaScores({...criteriaScores, [criterion.id]: i + 1})}
                                    className={`text-lg transition-colors ${
                                      i < (criteriaScores[criterion.id] || 5) ? 'text-yellow-500' : 'text-gray-300'
                                    } hover:text-yellow-400`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comment */}
                    <div>
                      <Label htmlFor="review-comment">Your Review</Label>
                      <textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border rounded-md min-h-[100px]"
                        placeholder="Share your thoughts about this eBook..."
                      />
                    </div>

                    {/* Verification Code (pre-filled if available) */}
                    {ebook.verification_code && (
                      <div>
                        <Label htmlFor="review-code">Verification Code (pre-filled)</Label>
                        <Input
                          id="review-code"
                          type="text"
                          value={reviewPurchaseCode || ebook.verification_code}
                          onChange={(e) => setReviewPurchaseCode(e.target.value)}
                          className="mt-2"
                          placeholder="Enter purchase verification code"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This code helps verify your purchase. It's pre-filled from your purchase.
                        </p>
                      </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false);
                          // Reset form if not editing
                          if (!existingReview) {
                            setReviewRating(5);
                            setReviewComment('');
                            setReviewPurchaseCode('');
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Positive Feedback Section */}
          {ebook.positive_feedback && ebook.positive_feedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What Readers Are Saying</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {ebook.positive_feedback.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 space-y-3">
                      {/* User Info with Photo */}
                      <div className="flex items-center gap-3">
                        {review.user_profile_picture ? (
                          <img
                            src={review.user_profile_picture}
                            alt={review.user_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-lg font-semibold">
                              {review.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={i < review.rating ? 'text-yellow-500 text-xs' : 'text-gray-300 text-xs'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-sm text-gray-700 line-clamp-4">{review.comment}</p>

                      {/* Verified Badge */}
                      {review.purchase_verified && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <span>✓</span>
                          <span>Verified Purchase</span>
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Reviews Section */}
          {allReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">All Reviews ({allReviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReviews ? (
                  <p className="text-center text-gray-500 py-4">Loading reviews...</p>
                ) : (
                  <div className="space-y-4">
                    {allReviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          {review.user?.profile_picture ? (
                            <img
                              src={review.user.profile_picture}
                              alt={review.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm font-semibold">
                                {review.user?.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{review.user?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={i < review.rating ? 'text-yellow-500 text-xs' : 'text-gray-300 text-xs'}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              {review.purchase_verified && (
                                <span className="text-xs text-green-600">✓ Verified</span>
                              )}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EbookDetailPage;

