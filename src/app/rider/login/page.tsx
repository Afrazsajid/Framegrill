'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bike, Phone, Lock, Flame, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

export default function RiderLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('Please enter both phone number and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'rider', phone: phone.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      login({
        id: data.id,
        name: data.name,
        role: 'rider',
        phone: data.phone,
        email: data.email,
      });

      toast({
        title: 'Welcome back!',
        description: `Hi ${data.name}, ready for deliveries?`,
      });

      router.push('/rider');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="bg-brand-secondary px-6 pt-16 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-brand blur-3xl" />
          <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-brand-accent blur-3xl" />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="relative z-10"
        >
          <div className="w-20 h-20 rounded-full bg-brand mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-brand-accent" />
            <h1 className="text-2xl font-bold text-white tracking-tight">FlameGrill</h1>
          </div>
          <p className="text-blue-200 text-sm font-medium">Rider Portal</p>
        </motion.div>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6 pt-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-1">Login as Rider</h2>
          <p className="text-muted-foreground text-sm mb-8">Enter your rider credentials to get started</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555-201-0001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 text-base rounded-xl border-input focus-visible:border-brand focus-visible:ring-brand"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 text-base rounded-xl border-input focus-visible:border-brand focus-visible:ring-brand"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-base shadow-md active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Contact support if you need access to the rider portal
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
