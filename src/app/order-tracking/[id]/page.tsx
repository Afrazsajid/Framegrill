'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  ChefHat,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Star,
  ShoppingBag,
  Phone,
  MapPin,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { ToastContainer } from '@/components/customer/toast-container';
import { useUIStore } from '@/store/ui-store';
import type { BrandingConfig } from '@/lib/branding';

type OrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: string;
  paymentMethod: string;
  items: {
    id: string;
    itemName: string;
    itemImage: string | null;
    itemPrice: number;
    quantity: number;
    variation: string | null;
    addons: string | null;
    notes: string | null;
  }[];
  rider: { id: string; name: string; phone: string } | null;
  deliveryArea: { id: string; name: string; slug: string } | null;
  review: { id: string; rating: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

const ALL_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-500' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'text-blue-500' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-500' },
  { key: 'ready', label: 'Ready', icon: Package, color: 'text-purple-500' },
  { key: 'picked_up', label: 'Picked Up', icon: Package, color: 'text-indigo-500' },
  { key: 'on_the_way', label: 'On the Way', icon: Truck, color: 'text-cyan-500' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-500' },
];

const CANCELLED_STATUS = 'cancelled';

function getStepIndex(status: string): number {
  const idx = ALL_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const fetchOrder = useCallback(async () => {
    const id = params.id as string;
    if (!id) return;
    try {
      const res = await fetch(`/api/orders?id=${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (error) return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder, error]);

  const currency = branding?.currency || '$';
  const isCancelled = order?.status === CANCELLED_STATUS;
  const currentStep = order ? getStepIndex(order.status) : -1;
  const isDelivered = order?.status === 'delivered';
  const hasReview = !!order?.review;

  const submitReview = async () => {
    if (reviewRating === 0) {
      addToast('Please select a rating', 'error');
      return;
    }
    setReviewSubmitting(true);
    try {
      const itemId = order?.items[0]?.itemId;
      if (!itemId || !order) throw new Error('Missing data');
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          itemId,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
          customerName: order.customerName,
        }),
      });
      addToast('Review submitted! Thank you!', 'success');
      // Refresh order to show review
      fetchOrder();
    } catch {
      addToast('Failed to submit review', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground flex items-center gap-2">
            <RefreshCw className="size-5 animate-spin" />
            Loading order...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <XCircle className="size-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn&apos;t find that order</p>
            <Button asChild className="rounded-xl">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Order header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Order {order?.orderNumber}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed {order?.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={fetchOrder}
                >
                  <RefreshCw className="size-3.5" />
                  Refresh
                </Button>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isCancelled
                      ? 'bg-red-100 text-red-700'
                      : isDelivered
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isCancelled ? (
                    <XCircle className="size-4" />
                  ) : isDelivered ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                  {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered' : 'In Progress'}
                </span>
              </div>
            </div>

            {/* Status Progress */}
            {isCancelled ? (
              <Card className="rounded-2xl mb-8 border-red-200 bg-red-50/50">
                <CardContent className="p-6 text-center">
                  <XCircle className="size-12 text-red-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-red-700 mb-1">Order Cancelled</h2>
                  <p className="text-sm text-red-600/70">
                    This order has been cancelled. Please contact us if you have questions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl mb-8 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                    Order Status
                  </h3>

                  {/* Progress bar */}
                  <div className="relative mb-8">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / (ALL_STEPS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-0">
                    {ALL_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isReached = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div
                          key={step.key}
                          className={`flex items-start gap-4 ${idx < ALL_STEPS.length - 1 ? 'pb-6' : ''} ${
                            !isReached ? 'opacity-35' : ''
                          }`}
                        >
                          {/* Icon */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`flex items-center justify-center size-10 rounded-full shrink-0 transition-colors ${
                                isReached
                                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                  : 'bg-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                            >
                              <Icon className="size-5" />
                            </div>
                            {idx < ALL_STEPS.length - 1 && (
                              <div
                                className={`w-0.5 h-6 mt-1 rounded-full ${
                                  idx < currentStep ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            )}
                          </div>

                          {/* Label */}
                          <div className="pt-1.5">
                            <p className={`text-sm font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                              {step.label}
                            </p>
                            {isReached && !isCurrent && (
                              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
                            )}
                            {isCurrent && !isDelivered && (
                              <p className="text-xs text-primary/70 mt-0.5 font-medium">Current status</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order details + Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Items */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="size-4 text-primary" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order?.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="size-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.itemImage ? (
                          <img src={item.itemImage} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                            <ShoppingBag className="size-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.itemName}</p>
                        {item.variation && (
                          <p className="text-xs text-muted-foreground">{item.variation}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">x{item.quantity}</span>
                      <span className="text-sm font-semibold shrink-0 tabular-nums">
                        {currency}{(item.itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{currency}{order?.subtotal.toFixed(2)}</span>
                    </div>
                    {order && order.deliveryFee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span>{currency}{order.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span>{currency}{order?.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg font-bold text-muted-foreground">
                      {order?.customerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{order?.customerName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order?.orderType}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="size-4 shrink-0" />
                      <span>{order?.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground">
                      <MapPin className="size-4 mt-0.5 shrink-0" />
                      <div>
                        {order?.deliveryArea && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-0.5">
                            {order.deliveryArea.name}
                          </span>
                        )}
                        <span>{order?.deliveryAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Payment:</span>
                      <span className="capitalize">{order?.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Pay at Counter'}</span>
                    </div>
                  </div>
                  {order?.rider && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Assigned Rider</p>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-brand-secondary text-white flex items-center justify-center text-sm font-bold">
                            {order.rider.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{order.rider.name}</p>
                            <p className="text-xs text-muted-foreground">{order.rider.phone}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Review form for delivered orders */}
            {isDelivered && !hasReview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Rate Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          onMouseEnter={() => setHoveredStar(i + 1)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setReviewRating(i + 1)}
                          className="transition-transform hover:scale-110"
                          aria-label={`Rate ${i + 1} stars`}
                        >
                          <Star
                            className={`size-8 transition-colors ${
                              i < (hoveredStar || reviewRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="text-sm text-muted-foreground self-center ml-2">
                          {reviewRating}/5
                        </span>
                      )}
                    </div>

                    <Textarea
                      placeholder="Tell us about your experience (optional)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={3}
                    />

                    <Button
                      className="rounded-xl gap-2"
                      onClick={submitReview}
                      disabled={reviewSubmitting}
                    >
                      <Send className="size-4" />
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Already reviewed */}
            {isDelivered && hasReview && (
              <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-5 flex items-center gap-3">
                  <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Review Submitted</p>
                    <p className="text-xs text-emerald-600/70">
                      You rated this order {order.review.rating}/5
                      {order.review.comment && `: "${order.review.comment}"`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}