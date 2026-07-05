'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Loader2, Flame as FlameIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { trackUpsellEvent } from '@/lib/analytics';
import type { BrandingConfig } from '@/lib/branding';

type UpsellItem = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  prepTime: number;
  category: { id: string; name: string };
};

type Props = {
  placement: 'product_page' | 'cart_page' | 'checkout_page';
  productId?: string;
  categoryId?: string;
  cartItemIds?: string[];
  cartTotal?: number;
  areaId?: string;
  title?: string;
  limit?: number;
  variant?: 'default' | 'compact'; // compact for checkout
};

const DEFAULT_TITLES: Record<string, string> = {
  product_page: 'Goes well with this',
  cart_page: 'You may also like',
  checkout_page: 'Add before checkout',
};

export function UpsellSection({
  placement,
  productId,
  categoryId,
  cartItemIds = [],
  cartTotal,
  areaId,
  title,
  limit = 4,
  variant = 'default',
}: Props) {
  const [items, setItems] = useState<UpsellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState('$');
  const { addItem } = useCartStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then((b: BrandingConfig) => setCurrency(b.currency || '$'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ placement });
    if (productId) params.set('productId', productId);
    if (categoryId) params.set('categoryId', categoryId);
    if (cartItemIds.length > 0) params.set('cartItemIds', cartItemIds.join(','));
    if (cartTotal !== undefined) params.set('cartTotal', String(cartTotal));
    if (areaId) params.set('areaId', areaId);
    params.set('limit', String(limit));

    fetch(`/api/upsells?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          data.forEach((p: UpsellItem) => {
            trackUpsellEvent({ event: 'upsell_viewed', placement, productId: p.id });
          });
        }
        else setItems([]);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [placement, productId, categoryId, cartItemIds.join(','), cartTotal, areaId, limit]);

  const handleAdd = (item: UpsellItem) => {
    const cartBefore = useCartStore.getState().getSubtotal();
    addItem({
      itemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      variation: null,
      addons: [],
      notes: '',
    });
    setAddedIds((prev) => new Set(prev).add(item.id));
    addToast(`${item.name} added!`, 'success');
    trackUpsellEvent({
      event: 'upsell_added',
      placement,
      productId: item.id,
      cartTotalBefore: cartBefore,
      cartTotalAfter: cartBefore + item.price,
    });
  };

  // Don't render if loading or no items
  if (loading) return null;
  if (items.length === 0) return null;

  const displayTitle = title || DEFAULT_TITLES[placement] || 'You may also like';

  // Compact variant for checkout
  if (variant === 'compact') {
    return (
      <div className="pt-4 border-t border-border/60">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{displayTitle}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {items.map((item) => {
            const added = addedIds.has(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2.5 shrink-0 pl-1 pr-3 py-1.5 rounded-full border transition-all ${
                  added ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:border-primary/30'
                }`}
              >
                <div className="size-8 rounded-full overflow-hidden bg-muted shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FlameIcon className="size-3 text-muted-foreground/40" /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate max-w-[100px]">{item.name}</p>
                  <p className="text-[11px] font-semibold text-primary">{currency}{item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => !added && handleAdd(item)}
                  disabled={added}
                  className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    added ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary'
                  }`}
                >
                  {added ? <Check className="size-3" /> : <Plus className="size-3" />}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant for product page and cart
  const isProductPage = placement === 'product_page';
  return (
    <div className={isProductPage ? 'pt-5 border-t border-border/60' : 'pt-4 border-t border-border/40'}>
      <p className="text-sm font-semibold text-foreground mb-3">{displayTitle}</p>
      <div className={isProductPage
        ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1'
        : 'grid grid-cols-1 sm:grid-cols-2 gap-2'
      }>
        {items.map((item, i) => {
          const added = addedIds.has(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 shrink-0 p-2.5 rounded-xl border transition-all ${
                isProductPage ? 'w-[200px]' : ''
              } ${added ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-primary/30 bg-background'}`}
            >
              <div className="size-14 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><FlameIcon className="size-5 text-muted-foreground/30" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{item.category?.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-primary">{currency}{item.price.toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant={added ? 'secondary' : 'default'}
                    className={`h-7 px-2.5 text-xs rounded-lg gap-1 ${added ? 'text-primary' : ''}`}
                    onClick={() => !added && handleAdd(item)}
                    disabled={added}
                  >
                    {added ? <><Check className="size-3" /> Added</> : <><Plus className="size-3" /> Add</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}