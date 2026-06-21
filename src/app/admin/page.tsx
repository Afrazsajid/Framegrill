'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Clock, CheckCircle2, DollarSign, XCircle,
  TrendingUp, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Analytics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  todaySales: number;
  totalSales: number;
  topSellingItems: { name: string; totalSold: number }[];
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  rider?: { name: string } | null;
  items: { itemName: string; quantity: number; itemPrice: number }[];
}

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

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders'),
      ]);
      const analyticsData = await analyticsRes.json();
      const ordersData = await ordersRes.json();
      setAnalytics(analyticsData);
      setOrders(ordersData.slice(0, 8));
    } catch {
      // silent
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders'),
      ]);
      if (cancelled) return;
      const analyticsData = await analyticsRes.json();
      const ordersData = await ordersRes.json();
      setAnalytics(analyticsData);
      setOrders(ordersData.slice(0, 8));
      setLoading(false);
    };
    load();
    const interval = setInterval(fetchData, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-[#DC2626] animate-spin" />
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    { label: 'Total Orders', value: analytics.totalOrders, icon: ShoppingCart, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: "Today's Sales", value: `$${analytics.todaySales.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600', subValue: `${analytics.todayOrders} orders today` },
    { label: 'Pending Orders', value: analytics.pendingOrders, icon: Clock, color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: 'Completed', value: analytics.completedOrders, icon: CheckCircle2, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Cancelled', value: analytics.cancelledOrders, icon: XCircle, color: 'bg-red-500', lightBg: 'bg-red-50', textColor: 'text-red-600' },
  ];

  const pieData = [
    { name: 'Pending', value: analytics.pendingOrders },
    { name: 'Delivered', value: analytics.completedOrders },
    { name: 'Cancelled', value: analytics.cancelledOrders },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your restaurant performance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-slate-200/80 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${stat.lightBg}`}>
                      <Icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                    <TrendingUp className={`w-4 h-4 ${stat.textColor} opacity-40`} />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                  {'subValue' in stat && stat.subValue && (
                    <p className="text-xs text-slate-400 mt-2">{stat.subValue}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts & Top Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="h-full border-slate-200/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topSellingItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No sales data yet</p>
              ) : (
                analytics.topSellingItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.totalSold / (analytics.topSellingItems[0]?.totalSold || 1)) * 100}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-[#DC2626] rounded-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{item.totalSold} sold</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="h-full border-slate-200/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Sales Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topSellingItems.length > 0 ? analytics.topSellingItems : [{ name: 'No data', totalSold: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="totalSold" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="h-full border-slate-200/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-[220px] flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute space-y-2 text-sm">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600">{d.name}: <strong>{d.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
                  No order data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Card className="border-slate-200/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Recent Orders</CardTitle>
              <Badge variant="secondary" className="text-xs">{orders.length} shown</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-slate-100">
                    <TableHead className="pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Items</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 font-mono text-sm font-semibold text-slate-800">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{order.customerName}</TableCell>
                        <TableCell className="text-sm text-slate-500 hidden sm:table-cell">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-800">
                          ${order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}
                          >
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Revenue Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8e] border-0 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, #DC2626 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <CardContent className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">${analytics.totalSales.toFixed(2)}</p>
              <p className="text-blue-300 text-sm mt-1">{analytics.totalOrders} total orders processed</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">All time</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}