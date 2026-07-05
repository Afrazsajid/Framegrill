'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  StickyNote,
  ExternalLink,
  Navigation,
  Package,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type OrderItem = {
  id: string;
  itemName: string;
  itemImage?: string;
  itemPrice: number;
  quantity: number;
  variation?: string;
  addons?: string;
  notes?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  items: OrderItem[];
  deliveryArea?: { id: string; name: string; slug: string };
  riderId?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200' },
  accepted: { label: 'Accepted', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
  preparing: { label: 'Preparing', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  ready: { label: 'Ready', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
  picked_up: { label: 'Picked Up', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-200' },
  on_the_way: { label: 'On the Way', color: 'text-cyan-700', bg: 'bg-cyan-100 border-cyan-200' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
  failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
};

const TIMELINE_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: ClipboardCheck },
  { key: 'picked_up', label: 'Picked Up', icon: PackageCheck },
  { key: 'on_the_way', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function getNextAction(status: string): { label: string; nextStatus: string; icon: React.ElementType; color: string } | null {
  switch (status) {
    case 'accepted':
      return { label: 'Mark as Picked Up', nextStatus: 'picked_up', icon: PackageCheck, color: 'bg-indigo-600 hover:bg-indigo-700' };
    case 'picked_up':
      return { label: 'Mark as On the Way', nextStatus: 'on_the_way', icon: Truck, color: 'bg-cyan-600 hover:bg-cyan-700' };
    case 'on_the_way':
      return { label: 'Mark as Delivered', nextStatus: 'delivered', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-700' };
    default:
      return null;
  }
}

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load order', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, toast]);

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        toast({
          title: 'Status updated',
          description: `Order marked as ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`,
        });
      } else {
        toast({ title: 'Update failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const mapsUrl = order
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`
    : '#';

  const currentStepIndex = order
    ? TIMELINE_STEPS.findIndex((step) => step.key === order.status)
    : -1;

  if (loading) {
    return (
      <div className="px-4 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Order not found</h3>
        <p className="text-sm text-muted-foreground mb-4">This order may have been removed.</p>
        <Button onClick={() => router.push('/rider')} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const action = getNextAction(order.status);
  const paymentLabel = order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod === 'counter' ? 'Paid at Counter' : order.paymentMethod;

  return (
    <div className="px-4 pt-3 pb-6">
      {/* Back Button */}
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-5"
      >
        <button
          onClick={() => router.push('/rider')}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Order Details</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{order.orderNumber}</p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="mb-4 py-0 overflow-hidden">
          <div
            className="h-1.5"
            style={{
              background: order.status === 'accepted' ? '#3B82F6' :
                order.status === 'picked_up' ? '#6366F1' :
                order.status === 'on_the_way' ? '#06B6D4' :
                order.status === 'delivered' ? '#22C55E' :
                'var(--brand-color)',
            }}
          />
          <CardContent className="p-5 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold ${statusConfig.bg} ${statusConfig.color} border mb-2`}>
              {statusConfig.label}
            </div>
            <p className="text-sm text-muted-foreground">
              {order.status === 'delivered'
                ? 'This delivery has been completed'
                : order.status === 'cancelled' || order.status === 'failed'
                ? 'This delivery was cancelled'
                : 'Update the status as you progress'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer & Delivery Info */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-4 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Customer & Delivery</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Customer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-sm text-brand hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {order.customerPhone}
                </a>
              </div>
            </div>

            <Separator />

            {/* Area */}
            {order.deliveryArea && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Delivery Area</p>
                    <p className="text-sm font-semibold text-brand">{order.deliveryArea.name}</p>
                  </div>
                </div>
              </>
            )}

            {/* Address */}
            <div>
              <div className="flex items-start gap-2 flex-1">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{order.deliveryAddress}</p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-brand font-medium hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                Open in Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Delivery Notes */}
            {order.deliveryNotes && (
              <>
                <Separator />
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Delivery Notes</p>
                    <p className="text-sm text-foreground">{order.deliveryNotes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Order Items */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="mb-4 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Order Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-xs font-bold text-secondary-foreground shrink-0">
                      {item.quantity}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.itemName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.variation && (
                          <span className="text-xs text-muted-foreground">{item.variation}</span>
                        )}
                        {item.addons && (
                          <span className="text-xs text-muted-foreground">
                            + {Array.isArray(item.addons) ? item.addons.join(', ') : (() => {
                              try { return JSON.parse(item.addons).join(', '); } catch { return item.addons; }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      ${(item.itemPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {index < order.items.length - 1 && (
                    <div className="mt-3 pl-10">
                      <Separator />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="text-foreground">{order.deliveryFee > 0 ? `$${order.deliveryFee.toFixed(2)}` : 'Free'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-brand">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <Separator className="my-4" />
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{paymentLabel}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Timeline */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-4 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Delivery Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between relative px-1">
              {/* Background line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-border" />
              {/* Active progress line */}
              <div
                className="absolute top-4 left-6 h-0.5 transition-all duration-500"
                style={{
                  width: currentStepIndex >= 0
                    ? `calc(${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}% - 0px)`
                    : '0%',
                  background: currentStepIndex >= TIMELINE_STEPS.length - 1 ? '#22C55E' : '#3B82F6',
                }}
              />

              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#22C55E] text-white'
                          : isCurrent
                          ? 'bg-[#3B82F6] text-white ring-4 ring-blue-100'
                          : 'bg-background border-2 border-border text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700 font-semibold' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        {/* Main Status Action */}
        {action && (
          <Button
            onClick={() => handleStatusUpdate(action.nextStatus)}
            disabled={updating}
            className={`w-full h-14 rounded-2xl text-base font-bold text-white ${action.color} shadow-lg active:scale-[0.98] transition-transform`}
          >
            {updating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </div>
            ) : (
              <>
                <action.icon className="w-5 h-5" />
                {action.label}
              </>
            )}
          </Button>
        )}

        {/* Secondary Actions */}
        <div className="flex gap-3">
          <a href={`tel:${order.customerPhone}`} className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-semibold">
              <Phone className="w-4 h-4" />
              Call Customer
            </Button>
          </a>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-semibold">
              <Navigation className="w-4 h-4" />
              Open Maps
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
