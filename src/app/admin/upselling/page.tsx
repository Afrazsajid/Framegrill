'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

/* ---------- Types ---------- */
type UpsellProduct = { id: string; name: string; price: number; image: string | null };
type RuleProduct = { id: string; productId: string; sortOrder: number; product: UpsellProduct };

type UpsellRule = {
  id: string;
  name: string;
  type: string;
  placement: string;
  priority: number;
  isActive: boolean;
  minCartValue: number | null;
  maxCartValue: number | null;
  areaId: string | null;
  triggerProductId: string | null;
  triggerCategoryId: string | null;
  triggerProduct: { id: string; name: string } | null;
  triggerCategory: { id: string; name: string } | null;
  area: { id: string; name: string } | null;
  products: RuleProduct[];
};

type MenuItem = { id: string; name: string; price: number; category: string };
type Category = { id: string; name: string };
type Area = { id: string; name: string };

const PLACEMENT_OPTIONS = [
  { value: 'product_page', label: 'Product Page' },
  { value: 'cart_page', label: 'Cart Page' },
  { value: 'checkout_page', label: 'Checkout Page' },
  { value: 'all', label: 'All Placements' },
];

const TYPE_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'cart', label: 'Cart' },
  { value: 'global', label: 'Global' },
];

export default function UpsellingPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<UpsellRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reference data for dropdowns
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('global');
  const [formPlacement, setFormPlacement] = useState('all');
  const [formTriggerProduct, setFormTriggerProduct] = useState('');
  const [formTriggerCategory, setFormTriggerCategory] = useState('');
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [formPriority, setFormPriority] = useState(0);
  const [formMinCart, setFormMinCart] = useState('');
  const [formMaxCart, setFormMaxCart] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, menuRes, catRes, areaRes] = await Promise.all([
        fetch('/api/admin/upsell-rules').then((r) => r.json()),
        fetch('/api/menu').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/delivery-areas').then((r) => r.json()),
      ]);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
      setMenuItems(Array.isArray(menuRes) ? menuRes.map((m: { id: string; name: string; price: number; category: { name: string } }) => ({ id: m.id, name: m.name, price: m.price, category: m.category?.name || '' })) : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setAreas(Array.isArray(areaRes) ? areaRes : []);
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const resetForm = () => {
    setFormName('');
    setFormType('global');
    setFormPlacement('all');
    setFormTriggerProduct('');
    setFormTriggerCategory('');
    setFormProductIds([]);
    setFormPriority(0);
    setFormMinCart('');
    setFormMaxCart('');
    setFormAreaId('');
    setFormActive(true);
    setProductSearch('');
    setEditRule(null);
    setShowForm(false);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (rule: UpsellRule) => {
    setEditRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormPlacement(rule.placement);
    setFormTriggerProduct(rule.triggerProductId || '');
    setFormTriggerCategory(rule.triggerCategoryId || '');
    setFormProductIds(rule.products.map((p) => p.productId));
    setFormPriority(rule.priority);
    setFormMinCart(rule.minCartValue !== null ? String(rule.minCartValue) : '');
    setFormMaxCart(rule.maxCartValue !== null ? String(rule.maxCartValue) : '');
    setFormAreaId(rule.areaId || '');
    setFormActive(rule.isActive);
    setShowForm(true);
  };

  const toggleProduct = (pid: string) => {
    if (formProductIds.includes(pid)) {
      setFormProductIds((prev) => prev.filter((id) => id !== pid));
    } else {
      if (formProductIds.length >= 6) return;
      setFormProductIds((prev) => [...prev, pid]);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast({ title: 'Rule name is required', variant: 'destructive' }); return; }
    if (formProductIds.length === 0) { toast({ title: 'At least one upsell product is required', variant: 'destructive' }); return; }
    if (formType === 'product' && !formTriggerProduct) { toast({ title: 'Select a trigger product', variant: 'destructive' }); return; }
    if (formType === 'category' && !formTriggerCategory) { toast({ title: 'Select a trigger category', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        type: formType,
        placement: formPlacement,
        triggerProductId: formType === 'product' ? formTriggerProduct : undefined,
        triggerCategoryId: formType === 'category' ? formTriggerCategory : undefined,
        productIds: formProductIds,
        priority: formPriority,
        minCartValue: formMinCart ? parseFloat(formMinCart) : null,
        maxCartValue: formMaxCart ? parseFloat(formMaxCart) : null,
        areaId: formAreaId || null,
        isActive: formActive,
      };

      if (editRule) {
        await fetch('/api/admin/upsell-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editRule.id, ...body }) });
        toast({ title: 'Rule updated' });
      } else {
        await fetch('/api/admin/upsell-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        toast({ title: 'Rule created' });
      }
      resetForm();
      fetchRules();
    } catch {
      toast({ title: 'Failed to save rule', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/upsell-rules?id=${id}`, { method: 'DELETE' });
      toast({ title: 'Rule deleted' });
      setDeleteId(null);
      fetchRules();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const filteredItems = menuItems.filter(
    (m) => !productSearch || m.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upselling Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product recommendations and upsell suggestions</p>
        </div>
        <Button onClick={openNewForm} className="rounded-xl gap-2" disabled={showForm}>
          <Plus className="size-4" /> New Rule
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editRule ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
              <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="size-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section 1: Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Rule Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Burger Combo" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <div className="relative">
                    <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm appearance-none pr-8">
                      {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={formActive} onCheckedChange={setFormActive} />
                    <span className="text-sm">{formActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2: Trigger */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Trigger</h3>
              {formType === 'product' && (
                <div className="space-y-2">
                  <Label>Trigger Product *</Label>
                  <div className="relative">
                    <select value={formTriggerProduct} onChange={(e) => setFormTriggerProduct(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm appearance-none pr-8">
                      <option value="">Select product...</option>
                      {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
              {formType === 'category' && (
                <div className="space-y-2">
                  <Label>Trigger Category *</Label>
                  <div className="relative">
                    <select value={formTriggerCategory} onChange={(e) => setFormTriggerCategory(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm appearance-none pr-8">
                      <option value="">Select category...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
              {(formType === 'cart' || formType === 'global') && (
                <p className="text-sm text-muted-foreground">No trigger needed — this rule applies to all {formType === 'cart' ? 'cart' : ''} views.</p>
              )}
            </div>

            <Separator />

            {/* Section 3: Upsell Products */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Upsell Products *</h3>
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." className="rounded-xl max-w-sm" />
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">No products found</p>
                ) : (
                  filteredItems.map((item) => {
                    const selected = formProductIds.includes(item.id);
                    return (
                      <button key={item.id} onClick={() => toggleProduct(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${selected ? 'bg-primary/5' : ''}`}>
                        <div className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                          {selected && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <span className="flex-1 truncate font-medium">{item.name}</span>
                        <span className="text-xs text-slate-400">${item.price.toFixed(2)}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{item.category}</Badge>
                      </button>
                    );
                  })
                )}
              </div>
              {formProductIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{formProductIds.length} product(s) selected</p>
              )}
            </div>

            <Separator />

            {/* Section 4: Placement & Conditions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Placement & Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Placement</Label>
                  <div className="relative">
                    <select value={formPlacement} onChange={(e) => setFormPlacement(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm appearance-none pr-8">
                      {PLACEMENT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input type="number" value={formPriority} onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Min Cart Value</Label>
                  <Input type="number" step="0.01" value={formMinCart} onChange={(e) => setFormMinCart(e.target.value)} placeholder="No limit" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Max Cart Value</Label>
                  <Input type="number" step="0.01" value={formMaxCart} onChange={(e) => setFormMaxCart(e.target.value)} placeholder="No limit" className="rounded-xl" />
                </div>
              </div>
              {areas.length > 0 && (
                <div className="space-y-2 max-w-sm">
                  <Label>Area Restriction</Label>
                  <div className="relative">
                    <select value={formAreaId} onChange={(e) => setFormAreaId(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm appearance-none pr-8">
                      <option value="">All areas</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editRule ? 'Update Rule' : 'Create Rule'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
      ) : rules.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-lg font-medium">No upsell rules yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first rule to start suggesting products</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="rounded-2xl">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{rule.name}</h3>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-[10px]">{rule.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Badge variant="outline" className="text-[10px]">{rule.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{PLACEMENT_OPTIONS.find((p) => p.value === rule.placement)?.label || rule.placement}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      {rule.triggerProduct && <span>Trigger: {rule.triggerProduct.name}</span>}
                      {rule.triggerCategory && <span>Category: {rule.triggerCategory.name}</span>}
                      {rule.area && <span>Area: {rule.area.name}</span>}
                      <span>Priority: {rule.priority}</span>
                      {rule.minCartValue !== null && <span>Min: ${rule.minCartValue}</span>}
                      {rule.maxCartValue !== null && <span>Max: ${rule.maxCartValue}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {rule.products.map((rp) => (
                        <span key={rp.id} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {rp.product.name} — ${rp.product.price.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditForm(rule)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Edit">
                      <Pencil className="size-4 text-slate-500" />
                    </button>
                    {deleteId === rule.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" className="h-8 text-xs rounded-lg" onClick={() => handleDelete(rule.id)}>Delete</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => setDeleteId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(rule.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" aria-label="Delete">
                        <Trash2 className="size-4 text-slate-500 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}