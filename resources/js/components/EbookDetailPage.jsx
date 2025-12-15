import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ebookAPI } from '../utils/api';

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
  }, [id]);

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
                      ${parseFloat(ebook.price || 0).toFixed(2)}
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
                        <p className="text-sm">Shipping: ${parseFloat(ebook.shipping_cost).toFixed(2)}</p>
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

        {/* Positive Feedback Section */}
        {ebook.positive_feedback && ebook.positive_feedback.length > 0 && (
          <div className="mt-8">
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
          </div>
        )}
      </div>
    </Layout>
  );
}

export default EbookDetailPage;

