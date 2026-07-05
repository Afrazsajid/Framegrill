'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore, type CartItem } from '@/store/cart-store';
import { useAreaStore } from '@/store/area-store';
import { UpsellSection } from '@/components/customer/upsell-section';
import type { BrandingConfig } from '@/lib/branding';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { selectedArea } = useAreaStore();
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const currency = branding?.currency || '$';
  const deliveryFee = branding?.deliveryFee || 2.99;
  const subtotal = getSubtotal();

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeCart(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="size-5 text-primary" />
            Your Cart
            {items.length > 0 && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({items.reduce((t, i) => t + i.quantity, 0)} items)
              </span>
            )}
          </SheetTitle>
          <SheetDescription>Review your items before checkout</SheetDescription>
        </SheetHeader>

        <Separator />

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="size-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add some delicious items from our menu to get started!
            </p>
            <Button asChild className="rounded-xl" onClick={closeCart}>
              <Link href="/#menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-5 py-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    onUpdateQty={(q) => updateQuantity(item.id, q)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Cart upsell */}
              {items.length > 0 && (
                <UpsellSection
                  placement="cart_page"
                  cartItemIds={items.map((i) => i.itemId)}
                  cartTotal={subtotal}
                  areaId={selectedArea?.id || undefined}
                  title="Complete your order"
                  limit={3}
                />
              )}
            </ScrollArea>

            <div className="border-t bg-background px-5 py-4 space-y-3 shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium">{currency}{deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{currency}{(subtotal + deliveryFee).toFixed(2)}</span>
              </div>
              <Button asChild className="w-full rounded-xl h-12 text-base font-semibold" size="lg">
                <Link href="/checkout" onClick={closeCart}>
                  Go to Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartItemRow({
  item,
  currency,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  currency: string;
  onUpdateQty: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 py-3 border-b border-border/50 last:border-0"
    >
      {/* Image */}
      <div className="size-16 sm:size-20 rounded-xl overflow-hidden bg-muted shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <ShoppingBag className="size-6" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold leading-tight truncate">{item.name}</h4>
        {item.variation && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.variation}</p>
        )}
        {item.addons.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">+ {item.addons.join(', ')}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQty(item.quantity - 1)}
              className="flex items-center justify-center size-7 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
            <button
              onClick={() => onUpdateQty(item.quantity + 1)}
              className="flex items-center justify-center size-7 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <span className="text-sm font-bold text-primary tabular-nums">
            {currency}{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="self-start p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors -mt-0.5 -mr-1"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
}