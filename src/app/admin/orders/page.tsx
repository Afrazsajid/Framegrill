'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, RefreshCw, MapPin, User, Phone, CreditCard,
  FileText, Package, ChevronDown, ChevronUp, Eye, Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

/* ── Types ─────────────────────────────────────────────────── */
interface OrderItem {
  id: string;
  itemName: string;
  itemImage: string | null;
  itemPrice: number;
  quantity: number;
  variation: string | null;
  addons: string | null;
  notes: string | null;
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
}

interface DeliveryArea {
  id: string;
  name: string;
  slug: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryNotes: string | null;
  deliveryAreaId: string | null;
  deliveryArea: DeliveryArea | null;
  paymentMethod: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  riderId: string | null;
  rider: Rider | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['on-the-way'],
  'on-the-way': ['delivered'],
  delivered: [],
  cancelled: [],
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ready: 'bg-purple-100 text-purple-800 border-purple-200',
  'on-the-way': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  'on-the-way': 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'on-the-way', label: 'On the Way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

/* ── Component ─────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch { /* silent */ }
  };

  const fetchRiders = async () => {
    try {
      const res = await fetch('/api/riders');
      if (res.ok) setRiders(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [ordersRes, ridersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/riders'),
      ]);
      if (cancelled) return;
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (ridersRes.ok) setRiders(await ridersRes.json());
      setLoading(false);
    };
    load();
    intervalRef.current = setInterval(fetchOrders, 10000);
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      toast({ title: `Order ${statusLabels[newStatus] || newStatus}` });
      fetchOrders();
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const assignRider = async (orderId: string, riderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, riderId }),
      });
      toast({ title: 'Rider assigned' });
      fetchOrders();
    } catch {
      toast({ title: 'Failed to assign rider', variant: 'destructive' });
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const availableRiders = riders.filter(r => r.isAvailable);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all orders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">Auto-refreshing every 10s</span>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-slate-100 h-auto flex-wrap">
            {statusTabs.map(st => (
              <TabsTrigger key={st.value} value={st.value}
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-xs">
                {st.label}
                {st.value !== 'all' && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 h-4">
                    {orders.filter(o => o.status === st.value).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Orders Table */}
      <Card className="border-slate-200/80">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent border-b-slate-100">
                  <TableHead className="pl-6 text-xs font-semibold text-slate-500 uppercase w-8" />
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Order</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Rider</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const nextStatuses = STATUS_FLOW[order.status] || [];
                    return (
                      <Fragment key={order.id}>
                        <TableRow className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="pl-6">
                            <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                              {expandedId === order.id
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-slate-800">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 hidden sm:table-cell">
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-slate-400">{order.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-slate-800">
                            ${order.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-medium ${statusColors[order.status] || ''}`}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Select
                              value={order.riderId || 'none'}
                              onValueChange={(val) => val !== 'none' && assignRider(order.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs w-36">
                                <SelectValue placeholder="Assign rider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No rider</SelectItem>
                                {availableRiders.map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 hidden sm:table-cell">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {nextStatuses.length > 0 && (
                                <Select onValueChange={(val) => updateStatus(order.id, val)}>
                                  <SelectTrigger className="h-7 text-xs w-28 mr-1">
                                    <SelectValue placeholder="Change" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {nextStatuses.map(s => (
                                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(order)}>
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded row - quick items preview */}
                        <AnimatePresence>
                          {expandedId === order.id && (
                            <TableRow>
                              <TableCell colSpan={9} className="bg-slate-50/50 p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      {order.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 text-sm border border-slate-100">
                                          <span className="text-slate-700 font-medium">{item.itemName}</span>
                                          <span className="text-slate-400">×{item.quantity}</span>
                                          <span className="text-slate-600 font-semibold">${(item.itemPrice * item.quantity).toFixed(2)}</span>
                                          {item.variation && (
                                            <Badge variant="outline" className="text-[10px] px-1.5">{item.variation}</Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ ORDER DETAIL DIALOG ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-lg">Order {selectedOrder.orderNumber}</DialogTitle>
                  <Badge variant="outline" className={`text-xs font-medium ${statusColors[selectedOrder.status] || ''}`}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>
                <DialogDescription>
                  {new Date(selectedOrder.createdAt).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Customer info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer</h4>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700 font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{selectedOrder.customerPhone}</span>
                    </div>
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedOrder.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery</h4>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    {selectedOrder.deliveryArea && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-brand mt-0.5" />
                        <span className="font-medium text-brand">{selectedOrder.deliveryArea.name}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <span className="text-slate-600">{selectedOrder.deliveryAddress}</span>
                    </div>
                    {selectedOrder.deliveryNotes && (
                      <p className="text-sm text-slate-500 italic">Note: {selectedOrder.deliveryNotes}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Items</h4>
                  <div className="bg-slate-50 rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item, i) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-3 p-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{item.itemName}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {item.variation && <span>{item.variation}</span>}
                              {item.addons && <span>• {item.addons}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700">
                              ${(item.itemPrice * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">×{item.quantity} @ ${item.itemPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        {i < selectedOrder.items.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Totals */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment</h4>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-700">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Delivery Fee</span>
                      <span className="text-slate-700">${selectedOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-800">Total</span>
                      <span className="font-bold text-slate-900 text-lg">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Rider info */}
                {selectedOrder.rider && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Rider</h4>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Bike className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">{selectedOrder.rider.name}</span>
                        <span className="text-slate-400">• {selectedOrder.rider.phone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Rider actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {(STATUS_FLOW[selectedOrder.status] || []).length > 0 && (
                    <Select onValueChange={(val) => {
                      updateStatus(selectedOrder.id, val);
                      setSelectedOrder({ ...selectedOrder, status: val });
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(STATUS_FLOW[selectedOrder.status] || []).map(s => (
                          <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={selectedOrder.riderId || 'none'}
                    onValueChange={(val) => {
                      if (val !== 'none') {
                        assignRider(selectedOrder.id, val);
                        const rider = riders.find(r => r.id === val);
                        setSelectedOrder({ ...selectedOrder, riderId: val, rider: rider || null });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Assign Rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Rider</SelectItem>
                      {riders.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name} {!r.isAvailable ? '(Busy)' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

