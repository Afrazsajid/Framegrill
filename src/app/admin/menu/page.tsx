'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Flame, Leaf, Sparkles,
  ImageOff, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

/* ── Types ─────────────────────────────────────────────────── */
interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { items: number };
}

interface Variation {
  name: string;
  priceMod: number;
  isDefault: boolean;
}

interface Addon {
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  categoryId: string;
  category?: { name: string };
  isAvailable: boolean;
  isPopular: boolean;
  isNew: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  calories: number | null;
  prepTime: number;
  variations: Variation[];
  addons: Addon[];
}

const emptyVariation = (): Variation => ({ name: '', priceMod: 0, isDefault: false });
const emptyAddon = (): Addon => ({ name: '', price: 0 });

/* ── Component ─────────────────────────────────────────────── */
export default function AdminMenuPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('categories');
  const [loading, setLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);

  // Menu items state
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', description: '', price: 0, categoryId: '', image: '',
    calories: 0, prepTime: 15, isAvailable: true, isPopular: false,
    isNew: false, isSpicy: false, isVegetarian: false,
  });
  const [variations, setVariations] = useState<Variation[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [itemDeleteId, setItemDeleteId] = useState<string | null>(null);

  // Fetch data
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch { /* silent */ }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) setItems(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [catRes, itemRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu'),
      ]);
      if (cancelled) return;
      if (catRes.ok) setCategories(await catRes.json());
      if (itemRes.ok) setItems(await itemRes.json());
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Category CRUD ──
  const openCatDialog = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', description: '' });
    }
    setCatDialogOpen(true);
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) return;
    try {
      if (editingCat) {
        await fetch('/api/categories', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCat.id, name: catForm.name, description: catForm.description, isActive: editingCat.isActive }),
        });
        toast({ title: 'Category updated' });
      } else {
        await fetch('/api/categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catForm.name, description: catForm.description || null }),
        });
        toast({ title: 'Category created' });
      }
      setCatDialogOpen(false);
      fetchCategories();
    } catch {
      toast({ title: 'Error saving category', variant: 'destructive' });
    }
  };

  const deleteCat = async () => {
    if (!catDeleteId) return;
    try {
      await fetch(`/api/categories?id=${catDeleteId}`, { method: 'DELETE' });
      toast({ title: 'Category deleted' });
      setCatDeleteId(null);
      fetchCategories();
    } catch {
      toast({ title: 'Error deleting category', variant: 'destructive' });
    }
  };

  const toggleCatActive = async (cat: Category) => {
    try {
      await fetch('/api/categories', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      fetchCategories();
    } catch { /* silent */ }
  };

  // ── Menu Item CRUD ──
  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name, description: item.description, price: item.price,
        categoryId: item.categoryId, image: item.image || '', calories: item.calories || 0,
        prepTime: item.prepTime, isAvailable: item.isAvailable, isPopular: item.isPopular,
        isNew: item.isNew, isSpicy: item.isSpicy, isVegetarian: item.isVegetarian,
      });
      setVariations(item.variations.length ? item.variations : [emptyVariation()]);
      setAddons(item.addons.length ? item.addons : [emptyAddon()]);
    } else {
      setEditingItem(null);
      setItemForm({
        name: '', description: '', price: 0, categoryId: '', image: '',
        calories: 0, prepTime: 15, isAvailable: true, isPopular: false,
        isNew: false, isSpicy: false, isVegetarian: false,
      });
      setVariations([emptyVariation()]);
      setAddons([emptyAddon()]);
    }
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.categoryId) return;
    const cleanVariations = variations.filter(v => v.name.trim());
    const cleanAddons = addons.filter(a => a.name.trim());
    try {
      const payload = {
        ...(editingItem ? { id: editingItem.id } : {}),
        ...itemForm,
        variations: cleanVariations,
        addons: cleanAddons,
      };
      await fetch('/api/menu', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast({ title: editingItem ? 'Item updated' : 'Item created' });
      setItemDialogOpen(false);
      fetchItems();
      fetchCategories();
    } catch {
      toast({ title: 'Error saving item', variant: 'destructive' });
    }
  };

  const deleteItem = async () => {
    if (!itemDeleteId) return;
    try {
      await fetch(`/api/menu?id=${itemDeleteId}`, { method: 'DELETE' });
      toast({ title: 'Item deleted' });
      setItemDeleteId(null);
      fetchItems();
      fetchCategories();
    } catch {
      toast({ title: 'Error deleting item', variant: 'destructive' });
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await fetch('/api/menu', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
      });
      fetchItems();
    } catch { /* silent */ }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage categories and menu items</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
            Categories ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
            Menu Items ({items.length})
          </TabsTrigger>
        </TabsList>

        {/* ═══ CATEGORIES TAB ═══ */}
        <TabsContent value="categories" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openCatDialog()} className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>
          <Card className="border-slate-200/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-slate-100">
                    <TableHead className="pl-6 text-xs font-semibold text-slate-500 uppercase">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Items</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Active</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">No categories yet</TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 font-medium text-slate-800">{cat.name}</TableCell>
                        <TableCell className="text-sm text-slate-500 hidden sm:table-cell max-w-xs truncate">
                          {cat.description || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold">{cat._count?.items ?? 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={cat.isActive}
                            onCheckedChange={() => toggleCatActive(cat)}
                          />
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCatDialog(cat)}>
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCatDeleteId(cat.id)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ MENU ITEMS TAB ═══ */}
        <TabsContent value="items" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => openItemDialog()} className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="grid gap-3">
            {filteredItems.length === 0 ? (
              <Card className="border-slate-200/80">
                <CardContent className="py-12 text-center text-slate-400">No items found</CardContent>
              </Card>
            ) : (
              filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="border-slate-200/80 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {item.isPopular && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0"><Sparkles className="w-2.5 h-2.5 mr-0.5" />Popular</Badge>}
                                  {item.isNew && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">New</Badge>}
                                  {item.isSpicy && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0"><Flame className="w-2.5 h-2.5 mr-0.5" />Spicy</Badge>}
                                  {item.isVegetarian && <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0"><Leaf className="w-2.5 h-2.5 mr-0.5" />Veg</Badge>}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{item.category?.name} • {item.prepTime} min</p>
                            </div>
                            <span className="text-lg font-bold text-slate-900">${item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Switch
                              checked={item.isAvailable}
                              onCheckedChange={() => toggleItemAvailability(item)}
                              className="data-[state=unchecked]:bg-slate-200"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-400 mr-1">{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemDialog(item)}>
                                <Edit2 className="w-4 h-4 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItemDeleteId(item.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ CATEGORY DIALOG ═══ */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingCat ? 'Update category details' : 'Create a new menu category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="e.g. Burgers"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCat} className="bg-brand hover:bg-brand-hover text-white">
              {editingCat ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MENU ITEM DIALOG ═══ */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item details' : 'Add a new item to your menu'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Item Name *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Classic Cheeseburger"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Describe the item..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={itemForm.categoryId}
                  onValueChange={(val) => setItemForm({ ...itemForm, categoryId: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Prep Time (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.prepTime}
                  onChange={(e) => setItemForm({ ...itemForm, prepTime: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Calories</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.calories}
                  onChange={(e) => setItemForm({ ...itemForm, calories: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Options</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'isAvailable' as const, label: 'Available' },
                  { key: 'isPopular' as const, label: 'Popular' },
                  { key: 'isNew' as const, label: 'New Item' },
                  { key: 'isSpicy' as const, label: 'Spicy' },
                  { key: 'isVegetarian' as const, label: 'Vegetarian' },
                ].map((toggle) => (
                  <div key={toggle.key} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                    <Switch
                      checked={itemForm[toggle.key]}
                      onCheckedChange={(checked) => setItemForm({ ...itemForm, [toggle.key]: checked })}
                    />
                    <span className="text-sm text-slate-700">{toggle.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Variations (Size/Type)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setVariations([...variations, emptyVariation()])}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {variations.map((v, i) => (
                <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-lg p-3">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="e.g. Large"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...variations];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setVariations(updated);
                      }}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price modifier"
                        value={v.priceMod}
                        onChange={(e) => {
                          const updated = [...variations];
                          updated[i] = { ...updated[i], priceMod: parseFloat(e.target.value) || 0 };
                          setVariations(updated);
                        }}
                        className="h-8 text-sm w-28"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.isDefault}
                          onChange={(e) => {
                            const updated = variations.map((vr, j) => ({
                              ...vr,
                              isDefault: j === i ? e.target.checked : false,
                            }));
                            setVariations(updated);
                          }}
                          className="rounded border-slate-300"
                        />
                        Default
                      </label>
                    </div>
                  </div>
                  {variations.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => setVariations(variations.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Addons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Addons</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddons([...addons, emptyAddon()])}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {addons.map((a, i) => (
                <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-lg p-3">
                  <Input
                    placeholder="Addon name"
                    value={a.name}
                    onChange={(e) => {
                      const updated = [...addons];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setAddons(updated);
                    }}
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={a.price}
                    onChange={(e) => {
                      const updated = [...addons];
                      updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 };
                      setAddons(updated);
                    }}
                    className="h-8 text-sm w-24"
                  />
                  {addons.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => setAddons(addons.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveItem} className="bg-brand hover:bg-brand-hover text-white">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CATEGORY CONFIRMATION ═══ */}
      <AlertDialog open={!!catDeleteId} onOpenChange={() => setCatDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and cannot be undone. Items in this category may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCat} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ DELETE ITEM CONFIRMATION ═══ */}
      <AlertDialog open={!!itemDeleteId} onOpenChange={() => setItemDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu item, its variations, and addons. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}