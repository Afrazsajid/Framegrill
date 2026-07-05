'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Pencil, Trash2, Loader2, Check, X,
  GripVertical, Package, ToggleLeft, ToggleRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/store/ui-store';

type Area = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { orders: number };
};

const emptyForm = { name: '', slug: '', sortOrder: 0 };

export default function AdminAreasPage() {
  const { addToast } = useUIStore();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-areas');
      const data = await res.json();
      if (Array.isArray(data)) setAreas(data);
    } catch {
      addToast('Failed to fetch areas', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const filtered = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', sortOrder: areas.length });
    setFormOpen(true);
  };

  const openEdit = (area: Area) => {
    setEditing(area);
    setForm({ name: area.name, slug: area.slug, sortOrder: area.sortOrder });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      addToast('Name and slug are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const url = editing ? '/api/delivery-areas' : '/api/delivery-areas';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, ...form }
        : { ...form, isActive: true };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      addToast(editing ? 'Area updated' : 'Area created', 'success');
      setFormOpen(false);
      fetchAreas();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (area: Area) => {
    try {
      const res = await fetch('/api/delivery-areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: area.id, isActive: !area.isActive }),
      });
      if (!res.ok) throw new Error();
      addToast(`${area.name} ${!area.isActive ? 'enabled' : 'disabled'}`, 'success');
      fetchAreas();
    } catch {
      addToast('Failed to update area', 'error');
    }
  };

  const handleDelete = async () => {
    if (!areaToDelete) return;
    try {
      const res = await fetch(`/api/delivery-areas?id=${areaToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      addToast(`${areaToDelete.name} deleted`, 'success');
      setAreaToDelete(null);
      fetchAreas();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: !editing ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : f.slug,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Areas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage delivery zones — {areas.length} area{areas.length !== 1 ? 's' : ''},{' '}
            {areas.filter((a) => a.isActive).length} active
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl h-10 gap-2">
          <Plus className="size-4" />
          Add Area
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search areas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Area list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-16 text-center">
              <MapPin className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No delivery areas found</p>
              <p className="text-sm text-slate-400 mt-1">
                {search ? 'Try a different search' : 'Create your first delivery area'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((area, i) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="rounded-xl hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-brand/10 text-brand shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{area.name}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          area.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {area.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      /{area.slug} · Order {area.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(area)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      title={area.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {area.isActive ? (
                        <ToggleRight className="size-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="size-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(area)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="size-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => setAreaToDelete(area)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-4 text-red-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {editing ? 'Edit Delivery Area' : 'New Delivery Area'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editing ? 'Update area details' : 'Add a new delivery zone'}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Area Name</label>
                  <Input
                    placeholder="e.g. DHA Phase 5"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <Input
                    placeholder="e.g. dha-phase-5"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                    }
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">URL-friendly identifier, auto-generated from name</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Sort Order</label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Lower numbers appear first</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : editing ? (
                    <Check className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {areaToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setAreaToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="size-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Area</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <strong>{areaToDelete.name}</strong>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3">
                <Button variant="outline" onClick={() => setAreaToDelete(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="rounded-xl gap-2"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}