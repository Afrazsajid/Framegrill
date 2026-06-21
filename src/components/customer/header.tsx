'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Flame, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import type { BrandingConfig } from '@/lib/branding';

export function Header() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openCart } = useCartStore();
  const totalItems = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0));

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  const navLinks = [
    { label: 'Menu', href: '#menu' },
    { label: 'Full Menu', href: '/menu' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <Flame className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              {branding?.name || 'FlameGrill'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Phone (desktop) */}
            <a
              href={`tel:${branding?.phone?.replace(/\s/g, '') || ''}`}
              className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <Phone className="size-4" />
              {branding?.phone || '+1 555-123-4567'}
            </a>

            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={openCart}
              className="relative rounded-xl"
              aria-label={`Shopping cart with ${totalItems} items`}
            >
              <ShoppingCart className="size-5" />
              <AnimatePresence mode="popLayout">
                {totalItems > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border/40"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }
                      setMobileOpen(false);
                    }}
                    className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {branding?.phone && (
                  <a
                    href={`tel:${branding.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Phone className="size-4" />
                    {branding.phone}
                  </a>
                )}
                {branding?.address && (
                  <div className="flex items-start gap-2 px-4 py-2.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    {branding.address}
                  </div>
                )}
                {/* Subtle portal links */}
                <div className="px-4 pt-3 border-t border-border/40 flex gap-4">
                  <Link href="/admin" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    Admin
                  </Link>
                  <Link href="/rider" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    Rider
                  </Link>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}