'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, ShoppingBag, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { ToastContainer } from '@/components/customer/toast-container';
import type { BrandingConfig } from '@/lib/branding';

type OrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: string;
  deliveryArea: { id: string; name: string; slug: string } | null;
  items: {
    id: string;
    itemName: string;
    itemImage: string | null;
    itemPrice: number;
    quantity: number;
    variation: string | null;
    addons: string | null;
  }[];
  createdAt: string;
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;

    Promise.all([
      fetch(`/api/orders?id=${id}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch('/api/branding').then((r) => r.json()),
    ])
      .then(([o, b]) => {
        setOrder(o);
        setBranding(b);
      })
      .catch(() => setError(true));
  }, [params.id]);

  const currency = branding?.currency || '$';
  const estMinutes = 25 + (order?.items?.length || 0) * 5;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find that order</p>
            <Button asChild className="rounded-xl">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative inline-flex items-center justify-center mb-6"
          >
            <div className="absolute size-24 rounded-full bg-emerald-100 animate-pulse-ring" />
            <div className="relative size-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-10 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-1">
              Thank you for your order, {order?.customerName || 'Customer'}
            </p>

            {order && (
              <p className="text-sm text-muted-foreground mb-8">
                Order <span className="font-bold text-foreground">{order.orderNumber}</span> · 
                Estimated <span className="font-semibold text-foreground">{estMinutes} min</span>
              </p>
            )}

            {order && (
              <Card className="rounded-2xl text-left mb-8">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Details</h3>
                  {order.deliveryArea && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="size-3.5 text-primary" />
                      <span className="font-medium text-primary">{order.deliveryArea.name}</span>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="size-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {item.itemImage ? (
                            <img src={item.itemImage} alt={item.itemName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                              <ShoppingBag className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.itemName}</p>
                          {item.variation && (
                            <p className="text-xs text-muted-foreground">{item.variation}</p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">x{item.quantity}</span>
                        <span className="text-sm font-semibold shrink-0 tabular-nums">
                          {currency}{(item.itemPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{currency}{order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>{currency}{order.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span>{currency}{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="rounded-xl h-12 px-8 text-base font-semibold gap-2"
                onClick={() => order && router.push(`/order-tracking/${order.id}`)}
              >
                Track Order
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-12 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/#menu">Back to Menu</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}