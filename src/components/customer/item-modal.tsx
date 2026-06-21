'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Clock, Flame as FlameIcon, Leaf, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import type { MenuItemType } from './menu-card';
import type { BrandingConfig } from '@/lib/branding';

type Props = {
  item: MenuItemType | null;
  open: boolean;
  onClose: () => void;
};

export function ItemModal({ item, open, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [variation, setVariation] = useState(
    item?.variations?.find((v) => v.isDefault)?.name || ''
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('$');
  const { addItem, openCart } = useCartStore();
  const { addToast, setAddingToCart } = useUIStore();

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then((b: BrandingConfig) => setCurrency(b.currency || '$'))
      .catch(() => {});
  }, []);

  if (!item) return null;

  const basePrice = item.price;
  const varMod = item.variations?.find((v) => v.name === variation)?.priceMod || 0;
  const addonsTotal = item.addons
    ?.filter((a) => selectedAddons.includes(a.name))
    .reduce((sum, a) => sum + a.price, 0) || 0;
  const unitPrice = basePrice + varMod + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    setAddingToCart(item.id);
    addItem({
      itemId: item.id,
      name: item.name,
      price: unitPrice,
      image: item.image,
      quantity,
      variation: variation || null,
      addons: selectedAddons,
      notes,
    });
    addToast(`${item.name} added to cart!`, 'success');
    setAddingToCart(null);
    onClose();
    openCart();
  };

  const toggleAddon = (name: string) => {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Image */}
        <div className="relative aspect-[16/9] sm:aspect-[2/1] w-full overflow-hidden bg-muted rounded-t-xl">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <FlameIcon className="size-16" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex items-center justify-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {item.isPopular && (
              <Badge className="gap-1 text-[11px] bg-amber-500 text-white border-0 shadow-sm">⭐ Popular</Badge>
            )}
            {item.isSpicy && (
              <Badge variant="destructive" className="gap-1 text-[11px] shadow-sm">🌶 Spicy</Badge>
            )}
            {item.isVegetarian && (
              <Badge variant="outline" className="gap-1 text-[11px] bg-white/90 backdrop-blur-sm shadow-sm">
                <Leaf className="size-3" /> Vegetarian
              </Badge>
            )}
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Title + meta */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold">{item.name}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{item.category?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-primary">{currency}{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{item.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {item.calories && (
                <span className="flex items-center gap-1">🔥 {item.calories} cal</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {item.prepTime} min prep
              </span>
            </div>
          </div>

          <Separator />

          {/* Variations */}
          {item.variations && item.variations.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Choose Size</Label>
              <RadioGroup value={variation} onValueChange={setVariation} className="flex flex-wrap gap-2">
                {item.variations.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                      variation === v.name
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/40 text-foreground'
                    }`}
                  >
                    <RadioGroupItem value={v.name} className="sr-only" />
                    {v.name}
                    {v.priceMod !== 0 && (
                      <span className="text-xs font-semibold">
                        {v.priceMod > 0 ? '+' : ''}{currency}{v.priceMod.toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Extra Add-ons</Label>
              <div className="space-y-2">
                {item.addons.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddons.includes(a.name)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Checkbox
                      checked={selectedAddons.includes(a.name)}
                      onCheckedChange={() => toggleAddon(a.name)}
                    />
                    <span className="flex-1 text-sm font-medium">{a.name}</span>
                    {a.price > 0 && (
                      <span className="text-sm font-semibold text-muted-foreground">+{currency}{a.price.toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">Special Instructions</Label>
            <Textarea
              id="notes"
              placeholder="Any allergies or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <Separator />

          {/* Quantity + Add button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-2 border-border rounded-xl px-2 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
                aria-label="Decrease"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold tabular-nums text-base">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
                aria-label="Increase"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              className="flex-1 h-12 rounded-xl text-base font-bold gap-2"
              size="lg"
              onClick={handleAddToCart}
            >
              Add to Cart — {currency}{totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
        <DialogDescription className="sr-only">
          Customize and add {item.name} to your cart
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}