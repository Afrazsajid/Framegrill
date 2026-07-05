'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Truck, Store, Minus, Plus, Trash2, Loader2, MapPin, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Header } from '@/components/customer/header';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { ToastContainer } from '@/components/customer/toast-container';
import { UpsellSection } from '@/components/customer/upsell-section';
import { useCartStore, type CartItem } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useAreaStore } from '@/store/area-store';
import { AreaSelector } from '@/components/customer/area-selector';
import type { BrandingConfig } from '@/lib/branding';

type FormErrors = {
  name?: string;
  phone?: string;
  address?: string;
  minOrder?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { addToast } = useUIStore();
  const { selectedArea } = useAreaStore();
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'counter'>('cash');
  const [errors, setErrors] = useState<FormErrors>({});

  const currency = branding?.currency || '$';
  const deliveryFee = branding?.deliveryFee || 2.99;
  const minOrder = branding?.minOrder || 15;
  const subtotal = getSubtotal();
  const total = subtotal + (orderType === 'delivery' ? deliveryFee : 0);

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (orderType === 'delivery' && !address.trim()) e.address = 'Delivery address is required';
    if (subtotal < minOrder) e.minOrder = `Minimum order is ${currency}${minOrder.toFixed(2)}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const orderItems = items.map((item) => ({
        itemId: item.itemId,
        itemName: item.name,
        itemImage: item.image,
        itemPrice: item.price,
        quantity: item.quantity,
        variation: item.variation,
        addons: item.addons.join(', '),
        notes: item.notes || undefined,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          deliveryAddress: orderType === 'delivery' ? address.trim() : 'Collection',
          deliveryNotes: orderNotes.trim() || undefined,
          deliveryAreaId: orderType === 'delivery' ? (selectedArea?.id || undefined) : undefined,
          orderType,
          paymentMethod,
          subtotal,
          deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
          total,
          items: orderItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const order = await res.json();
      clearCart();
      addToast('Order placed successfully!', 'success');
      router.push(`/order-confirmation/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="size-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items before checking out</p>
            <Button asChild className="rounded-xl">
              <Link href="/#menu">Browse Menu</Link>
            </Button>
          </div>
        </main>
        <CartDrawer />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/#menu"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Menu
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold mb-8"
          >
            Checkout
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* Order Type */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as 'delivery' | 'collection')} className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        orderType === 'delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value="delivery" className="sr-only" />
                      <Truck className={`size-6 ${orderType === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${orderType === 'delivery' ? 'text-primary' : ''}`}>Delivery</span>
                      <span className="text-xs text-muted-foreground">{currency}{deliveryFee.toFixed(2)} fee</span>
                    </label>
                    <label
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        orderType === 'collection' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value="collection" className="sr-only" />
                      <Store className={`size-6 ${orderType === 'collection' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${orderType === 'collection' ? 'text-primary' : ''}`}>Collection</span>
                      <span className="text-xs text-muted-foreground">No fee</span>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Full Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                        className={`rounded-xl ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 555-000-0000"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
                        className={`rounded-xl ${errors.phone ? 'border-destructive' : ''}`}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  {/* Delivery area */}
                  {orderType === 'delivery' && (
                    <div className="space-y-2">
                      <Label>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          Delivery Area
                        </span>
                      </Label>
                      <div className="flex items-center gap-3">
                        {selectedArea ? (
                          <div className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
                            <MapPin className="size-4 text-primary" />
                            <span className="text-sm font-medium">{selectedArea.name}</span>
                          </div>
                        ) : null}
                        <AreaSelector />
                      </div>
                    </div>
                  )}
                  {orderType === 'delivery' && (
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          Delivery Address <span className="text-primary">*</span>
                        </span>
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="123 Main Street, Apt 4B, New York, NY 10001"
                        value={address}
                        onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: undefined })); }}
                        className={`rounded-xl resize-none ${errors.address ? 'border-destructive' : ''}`}
                        rows={3}
                      />
                      {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="orderNotes">Order Notes (optional)</Label>
                    <Textarea
                      id="orderNotes"
                      placeholder="Any special instructions for the kitchen..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'counter')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value="cash" className="sr-only" />
                      <Banknote className={`size-5 shrink-0 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${paymentMethod === 'cash' ? 'text-primary' : ''}`}>Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay when you receive</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'counter' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <RadioGroupItem value="counter" className="sr-only" />
                      <CreditCard className={`size-5 shrink-0 ${paymentMethod === 'counter' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${paymentMethod === 'counter' ? 'text-primary' : ''}`}>Pay at Counter</p>
                        <p className="text-xs text-muted-foreground">Pay when collecting</p>
                      </div>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Min order error */}
              {errors.minOrder && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
                  {errors.minOrder} — <Link href="/#menu" className="underline font-semibold">Add more items</Link>
                </div>
              )}
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="rounded-2xl sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                              <ShoppingBag className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variation && `${item.variation} · `}
                            x{item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0 tabular-nums">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{currency}{subtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-medium tabular-nums">{currency}{deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">{currency}{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Compact checkout upsell */}
                  <UpsellSection
                    placement="checkout_page"
                    cartItemIds={items.map((i) => i.itemId)}
                    cartTotal={subtotal}
                    areaId={selectedArea?.id || undefined}
                    title="Last chance to add"
                    limit={4}
                    variant="compact"
                  />

                  <Button
                    className="w-full h-12 rounded-xl text-base font-bold"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      `Place Order — ${currency}${total.toFixed(2)}`
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
                    By placing this order, you agree to our terms of service
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}