'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame as FlameIcon, Clock, Leaf, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BrandingConfig } from '@/lib/branding';

type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  isPopular: boolean;
  isNew: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  calories: number | null;
  prepTime: number;
  category: { id: string; name: string };
  variations: { id: string; name: string; priceMod: number; isDefault: boolean }[];
  addons: { id: string; name: string; price: number }[];
  _count?: { reviews: number };
};

type Props = {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
  index?: number;
};

export function MenuCard({ item, onAddToCart, index = 0 }: Props) {
  const [currency, setCurrency] = useState('$');
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then((b: BrandingConfig) => setCurrency(b.currency || '$'))
      .catch(() => {});
  }, []);

  const hasVariations = item.variations && item.variations.length > 0;
  const hasAddons = item.addons && item.addons.length > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariations || hasAddons) {
      onAddToCart(item);
    } else {
      // Direct add for simple items
      onAddToCart(item);
    }
  };

  const badges: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }[] = [];
  if (item.isPopular) badges.push({ label: 'Popular', variant: 'default', icon: <Star className="size-3" /> });
  if (item.isNew) badges.push({ label: 'New', variant: 'secondary', icon: <Sparkles className="size-3" /> });
  if (item.isSpicy) badges.push({ label: 'Spicy', variant: 'destructive', icon: <FlameIcon className="size-3" /> });
  if (item.isVegetarian) badges.push({ label: 'Veg', variant: 'outline', icon: <Leaf className="size-3" /> });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.5) }}
    >
      <Card className="card-hover overflow-hidden border-border/60 group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imgLoaded && (
            <div className="absolute inset-0 animate-shimmer" />
          )}
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <FlameIcon className="size-12" />
            </div>
          )}

          {/* Badges overlay */}
          {badges.length > 0 && (
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant} className="gap-1 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
                  {b.icon}
                  {b.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Prep time */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 text-white text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm">
            <Clock className="size-3" />
            {item.prepTime}min
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 gap-2">
          {/* Category */}
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.category?.name}
          </span>

          {/* Name */}
          <h3 className="font-semibold text-base leading-snug line-clamp-1">{item.name}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
            {item.description}
          </p>

          {/* Price + Button */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-lg font-bold text-foreground">{currency}{item.price.toFixed(2)}</span>
              {item.calories && (
                <span className="text-[11px] text-muted-foreground ml-2">{item.calories} cal</span>
              )}
            </div>
            <Button
              size="sm"
              className="rounded-xl h-9 px-4 text-sm font-semibold gap-1.5"
              onClick={handleAdd}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export type { MenuItemType };