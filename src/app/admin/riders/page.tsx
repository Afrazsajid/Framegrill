'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Phone, Mail, Bike, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

/* ── Types ─────────────────────────────────────────────────── */
interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  isAvailable: boolean;
  vehicleType: string;
  password: string;
  _count?: { orders: number };
  orders?: { status: string }[];
}

const vehicleIcons: Record<string, string> = {
  motorcycle: '🏍️',
  bicycle: '🚲',
  car: '🚗',
  scooter: '🛵',
};

/* ── Component ─────────────────────────────────────────────── */
export default function AdminRidersPage() {
  const { toast } = useToast();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', vehicleType: 'motorcycle', password: 'rider123',
  });

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

  const fetchRiders = async () => {
    try {
      const res = await fetch('/api/riders');
      if (res.ok) setRiders(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/riders');
      if (cancelled) return;
      if (res.ok) setRiders(await res.json());
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const openDialog = (rider?: Rider) => {
    if (rider) {
      setEditingRider(rider);
      setForm({
        name: rider.name, phone: rider.phone, email: rider.email || '',
        vehicleType: rider.vehicleType, password: '',
      });
    } else {
      setEditingRider(null);
      setForm({ name: '', phone: '', email: '', vehicleType: 'motorcycle', password: 'rider123' });
    }
    setDialogOpen(true);
  };

  const saveRider = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      const payload = editingRider
        ? { id: editingRider.id, name: form.name, phone: form.phone, email: form.email || null, vehicleType: form.vehicleType, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, phone: form.phone, email: form.email || null, vehicleType: form.vehicleType, password: form.password };

      await fetch('/api/riders', {
        method: editingRider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast({ title: editingRider ? 'Rider updated' : 'Rider added' });
      setDialogOpen(false);
      fetchRiders();
    } catch {
      toast({ title: 'Error saving rider', variant: 'destructive' });
    }
  };

  const confirmDelete = (rider: Rider) => {
    setRiderToDelete(rider);
    setDeleteId(rider.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/riders?id=${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Rider deleted' });
      setDeleteId(null);
      setRiderToDelete(null);
      fetchRiders();
    } catch {
      toast({ title: 'Error deleting rider', variant: 'destructive' });
    }
  };

  const toggleAvailability = async (rider: Rider) => {
    try {
      await fetch('/api/riders', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rider.id, isAvailable: !rider.isAvailable }),
      });
      fetchRiders();
    } catch { /* silent */ }
  };

  const activeOrders = (rider: Rider) => {
    return rider.orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0;
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage delivery riders</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-brand hover:bg-brand-hover text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Rider
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders', value: riders.length, color: 'text-slate-900' },
          { label: 'Available', value: riders.filter(r => r.isAvailable).length, color: 'text-emerald-600' },
          { label: 'Busy', value: riders.filter(r => !r.isAvailable).length, color: 'text-amber-600' },
          { label: 'Active Deliveries', value: riders.reduce((sum, r) => sum + activeOrders(r), 0), color: 'text-blue-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-slate-200/80">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {riders.length === 0 ? (
          <Card className="border-slate-200/80 col-span-full">
            <CardContent className="py-12 text-center text-slate-400">
              No riders yet. Add your first rider to get started.
            </CardContent>
          </Card>
        ) : (
          riders.map((rider, idx) => {
            const isActive = rider.isAvailable;
            const active = activeOrders(rider);
            return (
              <motion.div
                key={rider.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`border-slate-200/80 hover:shadow-sm transition-shadow ${!isActive ? 'opacity-75' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                          isActive ? 'bg-emerald-50' : 'bg-slate-100'
                        }`}>
                          {vehicleIcons[rider.vehicleType] || '🏍️'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{rider.name}</h3>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-0.5 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Available' : 'Busy'}
                          </Badge>
                        </div>
                      </div>
                      <Switch checked={isActive} onCheckedChange={() => toggleAvailability(rider)} />
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {rider.phone}
                      </div>
                      {rider.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {rider.email}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-800">{rider._count?.orders ?? 0}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Orders</p>
                        </div>
                        {active > 0 && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{active}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(rider)}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => confirmDelete(rider)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ═══ ADD/EDIT RIDER DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRider ? 'Edit Rider' : 'Add New Rider'}</DialogTitle>
            <DialogDescription>
              {editingRider ? 'Update rider information' : 'Register a new delivery rider'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rider@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(val) => setForm({ ...form, vehicleType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">🏍️ Motorcycle</SelectItem>
                  <SelectItem value="scooter">🛵 Scooter</SelectItem>
                  <SelectItem value="bicycle">🚲 Bicycle</SelectItem>
                  <SelectItem value="car">🚗 Car</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editingRider ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingRider ? '••••••••' : 'Set password'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRider} className="bg-brand hover:bg-brand-hover text-white">
              {editingRider ? 'Update' : 'Add Rider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setRiderToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rider</AlertDialogTitle>
            <AlertDialogDescription>
              {riderToDelete && activeOrders(riderToDelete) > 0
                ? `This rider has ${activeOrders(riderToDelete)} active delivery. Please reassign orders before deleting.`
                : 'This will permanently delete this rider. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={riderToDelete ? activeOrders(riderToDelete) > 0 : false}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}