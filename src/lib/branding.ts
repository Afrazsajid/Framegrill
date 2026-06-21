import { db } from '@/lib/db';

export type BrandingConfig = {
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
};

const defaultBranding: BrandingConfig = {
  id: 'default',
  name: 'FlameGrill',
  tagline: 'Premium Burgers & Grills Since 2018',
  logo: '',
  phone: '+1 555-123-4567',
  email: 'hello@flamegrill.com',
  address: '123 Main Street, Downtown, New York, NY 10001',
  openHours: 'Mon-Thu: 10AM-10PM | Fri-Sat: 10AM-12AM | Sun: 11AM-9PM',
  primaryColor: '#DC2626',
  secondaryColor: '#1E3A5F',
  accentColor: '#F59E0B',
  currency: '$',
  currencyCode: 'USD',
  deliveryFee: 2.99,
  minOrder: 15.0,
  deliveryRadius: 10.0,
  socialFacebook: 'https://facebook.com/flamegrill',
  socialInstagram: 'https://instagram.com/flamegrill',
  socialTwitter: 'https://twitter.com/flamegrill',
  heroImages: '[]',
  termsLink: '/terms',
  privacyLink: '/privacy',
};

export async function getBranding(): Promise<BrandingConfig> {
  try {
    const restaurant = await db.restaurant.findFirst();
    if (restaurant) {
      return {
        id: restaurant.id,
        name: restaurant.name,
        tagline: restaurant.tagline,
        logo: restaurant.logo,
        phone: restaurant.phone,
        email: restaurant.email,
        address: restaurant.address,
        openHours: restaurant.openHours,
        primaryColor: restaurant.primaryColor,
        secondaryColor: restaurant.secondaryColor,
        accentColor: restaurant.accentColor,
        currency: restaurant.currency,
        currencyCode: restaurant.currencyCode,
        deliveryFee: restaurant.deliveryFee,
        minOrder: restaurant.minOrder,
        deliveryRadius: restaurant.deliveryRadius,
        socialFacebook: restaurant.socialFacebook,
        socialInstagram: restaurant.socialInstagram,
        socialTwitter: restaurant.socialTwitter,
        heroImages: restaurant.heroImages,
        termsLink: restaurant.termsLink,
        privacyLink: restaurant.privacyLink,
      };
    }
  } catch {
    // Database not available, use defaults
  }
  return defaultBranding;
}

export { defaultBranding };