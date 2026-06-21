'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';
import { HeroSection } from '@/components/customer/hero-section';
import { MenuCard, type MenuItemType } from '@/components/customer/menu-card';
import { ItemModal } from '@/components/customer/item-modal';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { ToastContainer } from '@/components/customer/toast-container';
import { useCartStore } from '@/store/cart-store';
import type { BrandingConfig } from '@/lib/branding';

type Category = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  _count: { items: number };
};

export default function HomePage() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<MenuItemType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    Promise.all([
      fetch('/api/branding').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/menu').then((r) => r.json()),
    ])
      .then(([b, c, m]) => {
        setBranding(b);
        setCategories(c);
        setMenuItems(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const popularItems = menuItems.filter((i) => i.isPopular);
  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((i) => i.category?.id === activeCategory);
  const displayItems = filteredItems.slice(0, 6);

  const handleAddToCart = (item: MenuItemType) => {
    const hasVariations = item.variations && item.variations.length > 0;
    const hasAddons = item.addons && item.addons.length > 0;

    if (hasVariations || hasAddons) {
      setModalItem(item);
      setModalOpen(true);
    } else {
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
      openCart();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <HeroSection />

        {/* Popular Items */}
        {!loading && popularItems.length > 0 && (
          <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50/50 to-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="size-5 text-primary" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-primary">Most Ordered</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Popular Picks</h2>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {popularItems.slice(0, 4).map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setModalItem(item);
                      setModalOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <MenuCard item={item} onAddToCart={handleAddToCart} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Menu Section */}
        <section id="menu" className="py-12 md:py-16 scroll-mt-20" ref={menuRef}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="size-6 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our Menu</span>
                <Flame className="size-6 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">What Are You Craving?</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Fresh, handcrafted meals made with premium ingredients
              </p>
            </motion.div>

            {loading ? (
              <LoadingGrid />
            ) : (
              <>
                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      activeCategory === 'all'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                        activeCategory === cat.id
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {cat.name}
                      {cat._count?.items > 0 && (
                        <span className="ml-1.5 text-xs opacity-70">({cat._count.items})</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Menu grid */}
                {displayItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {displayItems.map((item, i) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setModalItem(item);
                          setModalOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <MenuCard item={item} onAddToCart={handleAddToCart} index={i} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Flame className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg font-medium">No items found in this category</p>
                  </div>
                )}

                {/* View Full Menu */}
                {menuItems.length > 6 && (
                  <div className="text-center mt-10">
                    <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-8 font-semibold gap-2">
                      <Link href="/menu">
                        View Full Menu
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <ToastContainer />

      <ItemModal
        key={modalItem?.id || 'none'}
        item={modalItem}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="space-y-6">
      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}