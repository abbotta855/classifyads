import React, { useState, useEffect } from 'react';
import { ratingAPI } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

function RatingModal({ ad, seller, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [criteriaScores, setCriteriaScores] = useState({});
  const [purchaseCode, setPurchaseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    // Load rating criteria
    ratingAPI.getCriteria()
      .then(res => {
        setCriteria(res.data);
        // Initialize criteria scores with default value of 5
        const initialScores = {};
        res.data.forEach(c => {
          initialScores[c.id] = 5;
        });
        setCriteriaScores(initialScores);
      })
      .catch(err => console.error('Error loading criteria:', err));

    // Check if user has already rated
    if (ad?.id) {
      ratingAPI.checkRating(ad.id)
        .then(res => {
          if (res.data.has_rated) {
            setExistingRating(res.data.rating);
            setRating(res.data.rating.rating);
            setComment(res.data.rating.comment || '');
            setPurchaseCode(res.data.rating.purchase_code || '');
            
            // Set criteria scores from existing rating
            const scores = {};
            if (res.data.rating.criteria_scores) {
              res.data.rating.criteria_scores.forEach(cs => {
                scores[cs.rating_criteria_id] = cs.score;
              });
            }
            setCriteriaScores(scores);
          }
        })
        .catch(err => console.error('Error checking rating:', err));
    }
  }, [ad?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const criteriaScoresArray = Object.keys(criteriaScores).map(criteriaId => ({
        criteria_id: parseInt(criteriaId),
        score: criteriaScores[criteriaId],
      }));

      const data = {
        ad_id: ad.id,
        rating: rating,
        comment: comment.trim() || null,
        criteria_scores: criteriaScoresArray,
        purchase_code: purchaseCode.trim() || null,
      };

      if (existingRating) {
        await ratingAPI.updateRating(existingRating.id, data);
      } else {
        await ratingAPI.submitRating(data);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating || !window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    setLoading(true);
    try {
      await ratingAPI.deleteRating(existingRating.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete rating');
    } finally {
      setLoading(false);
    }
  };

  if (!ad || !seller) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {existingRating ? 'Update Your Rating' : 'Rate This Seller'}
            </CardTitle>
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Rating for: <span className="font-semibold">{seller.name}</span>
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Ad: {ad.title}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Overall Rating *
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-transform hover:scale-110 ${
                      star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                {rating === 5 && 'Excellent'}
                {rating === 4 && 'Good'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Poor'}
                {rating === 1 && 'Very Poor'}
              </p>
            </div>

            {/* Criteria Ratings */}
            {criteria.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Rate by Criteria
                </Label>
                <div className="space-y-4">
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{criterion.name}</Label>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          {criteriaScores[criterion.id] || 5} / 5
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setCriteriaScores({
                              ...criteriaScores,
                              [criterion.id]: star,
                            })}
                            className={`text-xl transition-transform hover:scale-110 ${
                              star <= (criteriaScores[criterion.id] || 5)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
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
              <Label htmlFor="comment" className="text-base font-semibold mb-2 block">
                Your Review (Optional)
              </Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                placeholder="Share your experience with this seller..."
                maxLength={1000}
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {comment.length} / 1000 characters
              </p>
            </div>

            {/* Purchase Code (Optional) */}
            <div>
              <Label htmlFor="purchaseCode" className="text-base font-semibold mb-2 block">
                Purchase Code (Optional)
              </Label>
              <Input
                id="purchaseCode"
                type="text"
                value={purchaseCode}
                onChange={(e) => setPurchaseCode(e.target.value)}
                placeholder="Enter purchase code if you have one"
                maxLength={100}
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Adding a purchase code verifies your review
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
              </Button>
              {existingRating && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RatingModal;

