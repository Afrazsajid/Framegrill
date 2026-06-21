'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, Palette, Store, Phone, Globe, DollarSign, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

/* ── Types ─────────────────────────────────────────────────── */
interface Branding {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  openHours: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  currencyCode: string;
  deliveryFee: number;
  minOrder: number;
  deliveryRadius: number;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  heroImages: string;
  termsLink: string;
  privacyLink: string;
}

const defaultBranding: Branding = {
  id: '', name: 'FlameGrill', tagline: 'Premium Burgers & Grills', logo: '',
  phone: '+1 555-123-4567', email: 'hello@flamegrill.com', address: '123 Main Street, Downtown, NY 10001',
  openHours: 'Mon-Sun: 10:00 AM - 11:00 PM', primaryColor: '#DC2626', secondaryColor: '#1E3A5F',
  accentColor: '#F59E0B', currency: '$', currencyCode: 'USD', deliveryFee: 2.99,
  minOrder: 15, deliveryRadius: 10, socialFacebook: '', socialInstagram: '', socialTwitter: '',
  heroImages: '[]', termsLink: '', privacyLink: '',
};

/* ── Component ─────────────────────────────────────────────── */
export default function AdminBrandingPage() {
  const { toast } = useToast();
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroJson, setHeroJson] = useState('[]');
  const [heroError, setHeroError] = useState('');

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding');
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
        setHeroJson(data.heroImages || '[]');
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/branding');
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
        setHeroJson(data.heroImages || '[]');
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateField = (field: keyof Branding, value: string | number) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleHeroJsonChange = (val: string) => {
    setHeroJson(val);
    try {
      JSON.parse(val);
      setHeroError('');
      updateField('heroImages', val);
    } catch {
      setHeroError('Invalid JSON format');
    }
  };

  const save = async () => {
    if (heroError) {
      toast({ title: 'Fix hero images JSON first', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
      toast({ title: 'Branding settings saved!', description: 'Changes applied successfully' });
    } catch {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-[#DC2626] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Branding</h1>
          <p className="text-slate-500 text-sm mt-1">Customize your restaurant appearance and settings</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* ── General Info ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">General Information</CardTitle>
              </div>
              <CardDescription>Basic restaurant details shown to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input value={branding.name} onChange={(e) => updateField('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={branding.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input value={branding.logo} onChange={(e) => updateField('logo', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Open Hours</Label>
                  <Input value={branding.openHours} onChange={(e) => updateField('openHours', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={branding.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Contact ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">Contact Information</CardTitle>
              </div>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={branding.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={branding.email} onChange={(e) => updateField('email', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Colors ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">Color Scheme</CardTitle>
              </div>
              <CardDescription>Customize brand colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Primary Color', field: 'primaryColor' as const, desc: 'Buttons, links, accents' },
                  { label: 'Secondary Color', field: 'secondaryColor' as const, desc: 'Sidebar, dark sections' },
                  { label: 'Accent Color', field: 'accentColor' as const, desc: 'Highlights, badges' },
                ].map((color) => (
                  <div key={color.field} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm flex-shrink-0"
                        style={{ background: branding[color.field] }}
                      />
                      <div>
                        <Label className="text-sm font-medium">{color.label}</Label>
                        <p className="text-xs text-slate-400">{color.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding[color.field]}
                        onChange={(e) => updateField(color.field, e.target.value)}
                        className="w-10 h-10 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        value={branding[color.field]}
                        onChange={(e) => updateField(color.field, e.target.value)}
                        className="flex-1 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map(field => (
                      <div
                        key={field}
                        className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                        style={{ background: branding[field] }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: branding.primaryColor }}>
                      Primary
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: branding.secondaryColor }}>
                      Secondary
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: branding.accentColor }}>
                      Accent
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Delivery Settings ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">Delivery & Pricing</CardTitle>
              </div>
              <CardDescription>Configure delivery options and currency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Currency Symbol</Label>
                  <Input value={branding.currency} onChange={(e) => updateField('currency', e.target.value)} maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label>Currency Code</Label>
                  <Input value={branding.currencyCode} onChange={(e) => updateField('currencyCode', e.target.value)} maxLength={3} className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Fee</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={branding.deliveryFee}
                    onChange={(e) => updateField('deliveryFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min. Order ({branding.currency})</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={branding.minOrder}
                    onChange={(e) => updateField('minOrder', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                  <Label>Delivery Radius (km)</Label>
                  <Input
                    type="number" step="0.5" min="1"
                    value={branding.deliveryRadius}
                    onChange={(e) => updateField('deliveryRadius', parseFloat(e.target.value) || 10)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Social Media ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">Social Media & Links</CardTitle>
              </div>
              <CardDescription>Social profiles and legal links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input value={branding.socialFacebook} onChange={(e) => updateField('socialFacebook', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input value={branding.socialInstagram} onChange={(e) => updateField('socialInstagram', e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X URL</Label>
                  <Input value={branding.socialTwitter} onChange={(e) => updateField('socialTwitter', e.target.value)} placeholder="https://x.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Terms of Service Link</Label>
                  <Input value={branding.termsLink} onChange={(e) => updateField('termsLink', e.target.value)} placeholder="/terms" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Privacy Policy Link</Label>
                  <Input value={branding.privacyLink} onChange={(e) => updateField('privacyLink', e.target.value)} placeholder="/privacy" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Hero Images ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-200/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#DC2626]" />
                <CardTitle className="text-base">Hero Images</CardTitle>
              </div>
              <CardDescription>JSON array of image URLs for the hero carousel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={heroJson}
                onChange={(e) => handleHeroJsonChange(e.target.value)}
                rows={5}
                className="font-mono text-sm"
                placeholder='["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'
              />
              {heroError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                  {heroError}
                </p>
              )}
              {heroJson && !heroError && (
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    try {
                      const imgs = JSON.parse(heroJson);
                      if (Array.isArray(imgs) && imgs.length > 0) {
                        return imgs.slice(0, 4).map((url: string, i: number) => (
                          <div key={i} className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={url} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ));
                      }
                    } catch { /* no-op */ }
                    return null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Save button at bottom */}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} size="lg" className="bg-[#DC2626] hover:bg-[#B91C1C] text-white min-w-[160px]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}