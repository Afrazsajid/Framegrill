'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, Bike,
  Palette, Star, LogOut, Menu as MenuIcon, X, Flame, MapPin, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Riders', href: '/admin/riders', icon: Bike },
  { label: 'Areas', href: '/admin/areas', icon: MapPin },
  { label: 'Upselling', href: '/admin/upselling', icon: TrendingUp },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (mounted && !isLoginPage && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [mounted, isLoginPage, isAuthenticated, user, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const handleNav = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const sidebar = (
    <div className="dark-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-brand">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">FlameGrill</h1>
          <p className="text-slate-400 text-[11px] tracking-wide uppercase">Admin Panel</p>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'active bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-brand' : ''}`} />
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-9 w-9 bg-brand-secondary border border-white/10">
            <AvatarFallback className="text-white text-xs font-semibold bg-brand/20 text-[#fca5a5]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MenuIcon className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Admin
          </div>

          <Avatar className="h-8 w-8 bg-brand-secondary">
            <AvatarFallback className="text-xs font-semibold bg-brand/10 text-brand">
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}