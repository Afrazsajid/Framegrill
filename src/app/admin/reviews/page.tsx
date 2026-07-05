'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, Loader2, MessageSquare, ImageOff, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

/* ── Types ─────────────────────────────────────────────────── */
interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  item: { name: string; image: string | null };
}

/* ── Helper Component (declared outside) ───────────────────── */
function StarsDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`}
        />
      ))}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────── */
export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) setReviews(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/reviews');
      if (cancelled) return;
      if (res.ok) setReviews(await res.json());
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const deleteReview = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/reviews?id=${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Review deleted' });
      setDeleteId(null);
      fetchReviews();
    } catch {
      toast({ title: 'Error deleting review', variant: 'destructive' });
    }
  };

  const filteredReviews = ratingFilter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(ratingFilter));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage customer feedback</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-200/80 h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
              <StarsDisplay rating={Math.round(avgRating)} size="md" />
              <p className="text-sm text-slate-500 mt-2">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200/80 h-full">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-14">
                      <span className="text-sm font-medium text-slate-700">{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + (5 - star) * 0.05 }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">{filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <Card className="border-slate-200/80">
            <CardContent className="py-12 text-center text-slate-400">
              {reviews.length === 0 ? 'No reviews yet' : 'No reviews match this filter'}
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="border-slate-200/80 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex gap-4">
                    {/* Item image */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {review.item?.image ? (
                        <img src={review.item.image} alt={review.item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Review content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StarsDisplay rating={review.rating} />
                            <span className="text-sm font-semibold text-slate-800">{review.customerName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            about <span className="font-medium text-slate-600">{review.item?.name || 'Unknown Item'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 hidden sm:block">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => setDeleteId(review.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="mt-2 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                        </div>
                      )}

                      <div className="sm:hidden mt-2">
                        <span className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This review will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReview} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}