/**
 * Simple internal analytics tracker.
 * Logs upsell events to console in dev and could be connected
 * to any analytics provider later.
 */

type UpsellEvent = {
  event: 'upsell_viewed' | 'upsell_clicked' | 'upsell_added';
  placement: string;
  productId: string;
  cartTotalBefore?: number;
  cartTotalAfter?: number;
  timestamp: number;
};

export function trackUpsellEvent(evt: Omit<UpsellEvent, 'timestamp'>) {
  const full: UpsellEvent = { ...evt, timestamp: Date.now() };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Upsell Analytics]', full);
  }

  // In production, send to your analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    try {
      navigator.sendBeacon('/api/analytics', JSON.stringify({
        type: 'upsell',
        ...full,
      }));
    } catch {
      // silent fail — analytics should never break UX
    }
  }
}