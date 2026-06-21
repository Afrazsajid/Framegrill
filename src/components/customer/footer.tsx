'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import type { BrandingConfig } from '@/lib/branding';

export function Footer() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  const name = branding?.name || 'FlameGrill';
  const tagline = branding?.tagline || 'Premium Burgers & Grills';
  const address = branding?.address || '123 Main Street, Downtown, NY 10001';
  const phone = branding?.phone || '+1 555-123-4567';
  const email = branding?.email || 'hello@flamegrill.com';
  const hours = branding?.openHours || 'Mon-Sun: 10AM-11PM';

  return (
    <footer id="contact" className="bg-foreground text-background/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground">
                <Flame className="size-5" />
              </div>
              <span className="text-xl font-bold text-background">{name}</span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed mb-4">{tagline}</p>
            <div className="flex gap-3">
              {branding?.socialFacebook && (
                <a
                  href={branding.socialFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="size-4" />
                </a>
              )}
              {branding?.socialInstagram && (
                <a
                  href={branding.socialInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="size-4" />
                </a>
              )}
              {branding?.socialTwitter && (
                <a
                  href={branding.socialTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center size-9 rounded-lg bg-background/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter className="size-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/40 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link href="/#menu" className="text-sm text-background/70 hover:text-primary transition-colors">Our Menu</Link></li>
              <li><Link href="/menu" className="text-sm text-background/70 hover:text-primary transition-colors">Full Menu</Link></li>
              <li><Link href="/checkout" className="text-sm text-background/70 hover:text-primary transition-colors">Order Now</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/40 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm text-background/70">{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-sm text-background/70 hover:text-primary transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary shrink-0" />
                <a href={`mailto:${email}`} className="text-sm text-background/70 hover:text-primary transition-colors">{email}</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/40 mb-4">Opening Hours</h3>
            <div className="flex items-start gap-2.5 mb-2">
              <Clock className="size-4 mt-0.5 text-primary shrink-0" />
              <span className="text-sm text-background/70">{hours}</span>
            </div>
            <p className="text-xs text-background/40 mt-4">We look forward to serving you!</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/40">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            {branding?.termsLink && (
              <Link href={branding.termsLink} className="text-xs text-background/30 hover:text-background/60 transition-colors">
                Terms
              </Link>
            )}
            {branding?.privacyLink && (
              <Link href={branding.privacyLink} className="text-xs text-background/30 hover:text-background/60 transition-colors">
                Privacy
              </Link>
            )}
            <Link href="/admin" className="text-xs text-background/20 hover:text-background/40 transition-colors">
              Admin
            </Link>
            <Link href="/rider" className="text-xs text-background/20 hover:text-background/40 transition-colors">
              Rider
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}