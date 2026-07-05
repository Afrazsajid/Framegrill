'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  PackageCheck,
  Truck,
  CheckCircle2,
  Inbox,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

type OrderItem = {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  riderId?: string;
  createdAt: string;
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

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} border text-xs font-semibold px-2 py-0.5`}>
      {config.label}
    </Badge>
  );
}

function getTimeElapsed(createdAt: string): string {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}m ago`;
}

function getNextAction(status: string): { label: string; nextStatus: string; icon: React.ElementType; color: string } | null {
  switch (status) {
    case 'accepted':
      return { label: 'Mark Picked Up', nextStatus: 'picked_up', icon: PackageCheck, color: 'bg-indigo-600 hover:bg-indigo-700' };
    case 'picked_up':
      return { label: 'Mark On the Way', nextStatus: 'on_the_way', icon: Truck, color: 'bg-cyan-600 hover:bg-cyan-700' };
    case 'on_the_way':
      return { label: 'Mark Delivered', nextStatus: 'delivered', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-700' };
    default:
      return null;
  }
}

export default function RiderDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // Silently fail on fetch errors during polling
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });
      if (res.ok) {
        toast({
          title: 'Status updated',
          description: `Order marked as ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`,
        });
        fetchOrders();
      } else {
        toast({
          title: 'Update failed',
          description: 'Could not update order status. Try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    setUpdating(order.id);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, riderId: user?.id, status: 'accepted' }),
      });
      if (res.ok) {
        toast({
          title: 'Order accepted!',
          description: `${order.orderNumber} assigned to you`,
        });
        setActiveTab('active');
        fetchOrders();
      } else {
        toast({
          title: 'Failed to accept',
          description: 'Could not accept this order. Try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  // Filter orders
  const riderId = user?.id;
  const activeOrders = orders.filter(
    (o) => o.riderId === riderId && ['accepted', 'picked_up', 'on_the_way'].includes(o.status)
  );
  const availableOrders = orders.filter(
    (o) => !o.riderId && (o.status === 'preparing' || o.status === 'ready')
  );

  const currentOrders = activeTab === 'active' ? activeOrders : availableOrders;

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Deliveries</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your orders on the go</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            activeTab === 'active'
              ? 'bg-brand text-white shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Package className="w-4 h-4" />
            Active
            {activeOrders.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white/25 text-[10px] flex items-center justify-center font-bold">
                {activeOrders.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            activeTab === 'available'
              ? 'bg-brand text-white shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Inbox className="w-4 h-4" />
            Available
            {availableOrders.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white/25 text-[10px] flex items-center justify-center font-bold">
                {availableOrders.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted-foreground text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="py-4">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-9 w-24 rounded-xl" />
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Orders List */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {currentOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                {activeTab === 'active' ? (
                  <Package className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {activeTab === 'active' ? 'No active deliveries' : 'No available orders'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {activeTab === 'active'
                  ? 'New deliveries assigned to you will appear here'
                  : 'Orders ready for pickup will show up here'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {currentOrders.map((order, index) => {
                const action = activeTab === 'active' ? getNextAction(order.status) : null;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    layout
                  >
                    <Card className="py-0 overflow-hidden border-border/80 hover:border-border transition-colors">
                      {/* Status indicator bar */}
                      <div
                        className="h-1"
                        style={{
                          background: order.status === 'accepted' ? '#3B82F6' :
                            order.status === 'picked_up' ? '#6366F1' :
                            order.status === 'on_the_way' ? '#06B6D4' :
                            '#A855F7',
                        }}
                      />
                      <CardContent className="p-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {getTimeElapsed(order.createdAt)}
                          </span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground line-clamp-2">{order.deliveryAddress}</p>
                        </div>

                        {/* Order Meta */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getTimeElapsed(order.createdAt)}</span>
                          </div>
                          <span className="font-semibold text-foreground ml-auto">${order.total.toFixed(2)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/rider/delivery/${order.id}`)}
                            variant="outline"
                            className="flex-1 h-11 rounded-xl text-sm font-medium"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Details
                          </Button>

                          {activeTab === 'active' && action && (
                            <Button
                              onClick={() => handleStatusUpdate(order.id, action.nextStatus)}
                              disabled={updating === order.id}
                              className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white ${action.color} shadow-sm active:scale-[0.98] transition-transform`}
                            >
                              {updating === order.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <action.icon className="w-4 h-4" />
                                  {action.label}
                                </>
                              )}
                            </Button>
                          )}

                          {activeTab === 'available' && (
                            <Button
                              onClick={() => handleAcceptOrder(order)}
                              disabled={updating === order.id}
                              className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover shadow-sm active:scale-[0.98] transition-transform"
                            >
                              {updating === order.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Accept
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
