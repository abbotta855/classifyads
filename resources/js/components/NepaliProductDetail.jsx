import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { nepaliProductAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './ui/UserAvatar';

export default function NepaliProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [submittingRating, setSubmittingRating] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await nepaliProductAPI.get(id);
      setProduct(res.data);
    } catch (e) {
      console.error('Failed to load product', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) load();
  }, [id]);

  const handleRating = async () => {
    if (!rating || !user) return;
    setSubmittingRating(true);
    try {
      await nepaliProductAPI.rate(id, rating, comment);
      setRating(0);
      setComment('');
      load(); // Reload to get updated ratings
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => interactive && onStarClick && onStarClick(i)}
          disabled={!interactive}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        >
          <span className={i <= rating ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}>
            ★
          </span>
        </button>
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  if (loading && !product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <p>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">Product not found</p>
            <Link to="/nepali-products">
              <Button variant="outline">← Back to Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <Link to="/nepali-products">
        <Button variant="outline" className="mb-4">← Back to Products</Button>
      </Link>

      {/* Product Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{product.title}</CardTitle>
              <p className="text-lg text-[hsl(var(--muted-foreground))]">{product.company_name}</p>
              <div className="flex items-center gap-4 mt-2">
                {renderStars(product.rating_average || 0)}
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  ({product.rating_count || 0} ratings)
                </span>
              </div>
            </div>
            {product.retail_price && (
              <div className="text-right">
                <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                  Rs. {product.retail_price.toLocaleString()}
                </p>
                {product.wholesale_price && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Wholesale: Rs. {product.wholesale_price.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="aspect-square bg-[hsl(var(--muted))] rounded-lg overflow-hidden">
                <img
                  src={currentImage?.image_url || currentImage?.image_path}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded overflow-hidden border-2 ${
                        selectedImageIndex === idx
                          ? 'border-[hsl(var(--primary))]'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img.image_url || img.image_path}
                        alt={`${product.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Company Name</h4>
              <p>{product.company_name}</p>
            </div>
            {product.company_history && (
              <div>
                <h4 className="font-semibold mb-1">Company History</h4>
                <p className="whitespace-pre-line">{product.company_history}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-1">Address</h4>
              <p>{product.company_address}</p>
              {product.company_latitude && product.company_longitude && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Coordinates: {product.company_latitude}, {product.company_longitude}
                </p>
              )}
            </div>
            {product.retail_contact && (
              <div>
                <h4 className="font-semibold mb-1">Retail Contact</h4>
                <p>{product.retail_contact}</p>
              </div>
            )}
            {product.wholesale_contact && (
              <div>
                <h4 className="font-semibold mb-1">Wholesale Contact</h4>
                <p>{product.wholesale_contact}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Production Items</h4>
              <p>{product.production_items}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Materials Used</h4>
              <p className="whitespace-pre-line">{product.materials_use}</p>
            </div>
            {product.nutrition_info && (
              <div>
                <h4 className="font-semibold mb-1">Nutrition Information</h4>
                <p className="whitespace-pre-line">{product.nutrition_info}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-1">Usability</h4>
              <p className="whitespace-pre-line">{product.usability}</p>
            </div>
            {(product.quantity || product.size || product.shape || product.color) && (
              <div>
                <h4 className="font-semibold mb-1">Specifications</h4>
                <ul className="space-y-1">
                  {product.quantity && <li>Quantity: {product.quantity}</li>}
                  {product.size && <li>Size: {product.size}</li>}
                  {product.shape && <li>Shape: {product.shape}</li>}
                  {product.color && <li>Color: {product.color}</li>}
                </ul>
              </div>
            )}
            {product.package_info && (
              <div>
                <h4 className="font-semibold mb-1">Package Information</h4>
                <p className="whitespace-pre-line">{product.package_info}</p>
              </div>
            )}
            {(product.manufacture_date || product.best_before) && (
              <div>
                <h4 className="font-semibold mb-1">Dates</h4>
                <ul className="space-y-1">
                  {product.manufacture_date && (
                    <li>Manufacture Date: {new Date(product.manufacture_date).toLocaleDateString()}</li>
                  )}
                  {product.best_before && (
                    <li>Best Before: {new Date(product.best_before).toLocaleDateString()}</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ratings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Form */}
          {user && (
            <div className="border-b border-[hsl(var(--border))] pb-6">
              <h4 className="font-semibold mb-4">Rate this product</h4>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Rating</label>
                  {renderStars(rating, true, setRating)}
                </div>
                <div>
                  <label className="block mb-2">Comment (optional)</label>
                  <Textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                  />
                </div>
                <Button
                  onClick={handleRating}
                  disabled={!rating || submittingRating}
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          )}

          {/* Existing Ratings */}
          {product.ratings && product.ratings.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold">What customers are saying</h4>
              {product.ratings.map((rating) => (
                <div key={rating.id} className="flex gap-4 border-b border-[hsl(var(--border))] pb-4 last:border-0">
                  <UserAvatar
                    src={rating.user?.profile_picture}
                    name={rating.user?.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{rating.user?.name || 'Anonymous'}</span>
                      {renderStars(rating.rating)}
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="whitespace-pre-line">{rating.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[hsl(var(--muted-foreground))] text-center py-4">
              No reviews yet. Be the first to review!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

