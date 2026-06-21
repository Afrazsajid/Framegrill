'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrandingConfig } from '@/lib/branding';

const fallbackImages = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop',
];

export function HeroSection() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [images, setImages] = useState<string[]>(fallbackImages);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then((data) => {
        setBranding(data);
        try {
          const parsed = JSON.parse(data.heroImages || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setImages(parsed);
          }
        } catch {}
      })
      .catch(() => {});
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const scrollToMenu = () => {
    const el = document.querySelector('#menu');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-[480px] sm:h-[520px] md:h-[580px] lg:h-[620px] overflow-hidden bg-foreground">
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {!loaded.has(current) && (
            <div className="absolute inset-0 bg-foreground" />
          )}
          <img
            src={images[current]}
            alt={`${branding?.name || 'FlameGrill'} hero ${current + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setLoaded((prev) => new Set([...prev, current]))}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="hero-gradient absolute inset-0 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <Flame className="size-8 sm:size-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg"
        >
          {branding?.name || 'FlameGrill'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-3 text-base sm:text-lg md:text-xl text-white/85 max-w-xl leading-relaxed"
        >
          {branding?.tagline || 'Premium Burgers & Grills'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-8 flex gap-3"
        >
          <Button
            size="lg"
            className="rounded-xl h-12 sm:h-14 px-8 text-base sm:text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
            onClick={scrollToMenu}
          >
            Order Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-xl h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
            asChild
          >
            <a href="/menu">View Menu</a>
          </Button>
        </motion.div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-10 sm:size-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5 sm:size-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-10 sm:size-12 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5 sm:size-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}