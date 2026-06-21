'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Package,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

type OrderItem = {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  variation?: string;
  addons?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: XCircle },
  failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' };
  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} border text-xs font-semibold px-2 py-0.5`}>
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RiderHistoryPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          // Filter for this rider's completed/cancelled/failed orders
          const riderOrders = data.filter(
            (o: Order) =>
              o.riderId === user?.id &&
              (o.status === 'delivered' || o.status === 'cancelled' || o.status === 'failed')
          );
          // Sort by most recent first
          riderOrders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(riderOrders);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.id]);

  // Summary stats
  const totalDeliveries = orders.filter((o) => o.status === 'delivered').length;
  const totalEarnings = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Delivery History</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your past deliveries and orders</p>
      </div>

      {/* Summary Cards */}
      {orders.length > 0 && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 gap-3 mb-5"
        >
          <Card className="py-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{totalDeliveries}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">${totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Earned</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="py-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order List */}
      {!loading && orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No history yet</h3>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Your completed and cancelled deliveries will appear here
          </p>
        </motion.div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => {
              const isExpanded = expandedId === order.id;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  layout
                >
                  <Card className="py-0 overflow-hidden border-border/80">
                    <CardContent className="p-0">
                      {/* Main row - tappable */}
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="w-full text-left p-4 flex items-center justify-between active:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-sm text-foreground">{order.customerName}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3">
                          <span className="text-sm font-bold text-foreground">${order.total.toFixed(2)}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator />
                            <div className="p-4 space-y-3">
                              {/* Address */}
                              <div className="text-xs text-muted-foreground">
                                {order.deliveryAddress}
                              </div>

                              <Separator />

                              {/* Items */}
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-muted-foreground font-medium">{item.quantity}x</span>
                                      <span className="text-foreground truncate">{item.itemName}</span>
                                    </div>
                                    <span className="text-foreground font-medium shrink-0 ml-2">
                                      ${(item.itemPrice * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <Separator />

                              {/* Totals */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Subtotal</span>
                                  <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Delivery Fee</span>
                                  <span>{order.deliveryFee > 0 ? `$${order.deliveryFee.toFixed(2)}` : 'Free'}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-foreground pt-1">
                                  <span>Total</span>
                                  <span className="text-[#DC2626]">${order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
