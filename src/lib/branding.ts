import { db } from '@/lib/db';
import { fallbackBranding } from '@/lib/fallback-data';

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

const defaultBranding: BrandingConfig = fallbackBranding;

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
