'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';
import { MenuCard, type MenuItemType } from '@/components/customer/menu-card';
import { ItemModal } from '@/components/customer/item-modal';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { ToastContainer } from '@/components/customer/toast-container';
import { useCartStore } from '@/store/cart-store';

type Category = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  _count: { items: number };
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'popular' | 'newest';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<MenuItemType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/menu').then((r) => r.json()),
    ])
      .then(([c, m]) => {
        setCategories(c);
        setMenuItems(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let items = menuItems;

    // Category filter
    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category?.id === activeCategory);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category?.name.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        items = [...items].sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        items = [...items].sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
      case 'newest':
        items = [...items].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return items;
  }, [menuItems, activeCategory, search, sortBy]);

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

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Default', value: 'default' },
    { label: 'Price: Low → High', value: 'price-asc' },
    { label: 'Price: High → Low', value: 'price-desc' },
    { label: 'Popular', value: 'popular' },
    { label: 'Newest', value: 'newest' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-10 md:py-14 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="size-6 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Full Menu</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Explore All Items</h1>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                From flame-grilled burgers to crispy sides, find your perfect meal
              </p>
            </motion.div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-56 shrink-0">
              <nav className="sticky top-24 space-y-1" aria-label="Category navigation">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Categories</h3>
                <SidebarItem
                  active={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                  label="All Items"
                  count={menuItems.length}
                />
                {categories.map((cat) => (
                  <SidebarItem
                    key={cat.id}
                    active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    label={cat.name}
                    count={cat._count?.items || 0}
                  />
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Mobile category scroll */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none -mx-4 px-4">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search + Sort */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search menu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl h-11"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 h-11 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <SlidersHorizontal className="size-4" />
                    <span className="hidden sm:inline">Sort</span>
                    <span className="sm:hidden">Sort</span>
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-background shadow-lg z-30 py-1.5 overflow-hidden">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === opt.value
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
                {activeCategory !== 'all' && ` in ${categories.find((c) => c.id === activeCategory)?.name}`}
                {search && ` matching "${search}"`}
              </p>

              {/* Grid */}
              {loading ? (
                <LoadingGrid />
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((item, i) => (
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
                <div className="text-center py-20">
                  <Flame className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg font-medium">No items match your search</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different category or search term</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <ToastContainer />
      <ItemModal key={modalItem?.id || 'none'} item={modalItem} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function SidebarItem({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
      <span
        className={`text-xs tabular-nums ${
          active ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
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
  );
}