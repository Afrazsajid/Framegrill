'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, LogOut, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const navItems = [
  { href: '/rider', label: 'Deliveries', icon: Package },
  { href: '/rider/history', label: 'History', icon: Clock },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const mounted = useHydrated();

  // Don't redirect on login page
  const isLoginPage = pathname === '/rider/login';

  const hasChecked = useRef(false);
  useEffect(() => {
    if (!mounted || hasChecked.current) return;
    hasChecked.current = true;
    if (!isAuthenticated || user?.role !== 'rider') {
      router.replace('/rider/login');
    }
  }, [mounted, isAuthenticated, user, router, isLoginPage]);

  // Show login page without chrome
  if (!mounted || !isAuthenticated || user?.role !== 'rider') {
    if (isLoginPage) {
      return <>{children}</>;
    }
    // Show loading state while redirecting
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#DC2626]/30 border-t-[#DC2626] rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/rider/login');
  };

  // No bottom nav on delivery detail page
  const showBottomNav = !pathname.includes('/rider/delivery/');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">FlameGrill Rider</h1>
              <p className="text-[11px] text-blue-200 leading-none mt-0.5">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-medium"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full relative transition-colors ${
                    isActive ? 'text-[#DC2626]' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="rider-nav-indicator"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#DC2626]"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
