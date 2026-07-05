import { db } from '@/lib/db';

/* ----------------------------------------------------------------
   Core server-side function: resolve upsell products for any context.
   Can be called from any API route or server action.
---------------------------------------------------------------- */
export type UpsellProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  prepTime: number;
  category: { id: string; name: string };
};

export type GetUpsellsInput = {
  placement: 'product_page' | 'cart_page' | 'checkout_page' | 'all';
  productId?: string;
  categoryId?: string;
  cartItemIds?: string[];
  cartTotal?: number;
  areaId?: string;
  limit?: number;
};

export async function getUpsellProducts(input: GetUpsellsInput): Promise<UpsellProduct[]> {
  const {
    placement,
    productId,
    categoryId,
    cartItemIds = [],
    cartTotal,
    areaId,
    limit = 4,
  } = input;

  const effectivePlacement = placement === 'all' ? ['product_page', 'cart_page', 'checkout_page'] : [placement];

  // 1. Fetch all active rules that match the placement
  const rules = await db.upsellRule.findMany({
    where: {
      isActive: true,
      placement: { in: effectivePlacement },
    },
    include: {
      products: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      triggerProduct: { select: { id: true } },
      triggerCategory: { select: { id: true } },
    },
    orderBy: { priority: 'desc' },
  });

  // 2. Filter rules by trigger conditions
  const matched = rules.filter((rule) => {
    // Area restriction
    if (rule.areaId && areaId && rule.areaId !== areaId) return false;
    if (rule.areaId && !areaId) return false; // rule requires area but none selected

    // Cart value conditions
    if (rule.minCartValue !== null && cartTotal !== undefined && cartTotal < rule.minCartValue) return false;
    if (rule.maxCartValue !== null && cartTotal !== undefined && cartTotal > rule.maxCartValue) return false;

    // Type-based matching
    switch (rule.type) {
      case 'product':
        return !!productId && rule.triggerProductId === productId;
      case 'category':
        if (categoryId && rule.triggerCategoryId === categoryId) return true;
        // Also match if any cart item belongs to this category
        if (cartItemIds.length > 0) {
          // We'll do a softer match — include category rules in cart/checkout context
          return true;
        }
        return false;
      case 'cart':
        return cartItemIds.length > 0;
      case 'global':
        return true;
      default:
        return false;
    }
  });

  // 3. For product page: prioritize product rules, then category, then global
  // For cart/checkout: prioritize cart rules, then product (from cart items), then global
  const scored = matched.map((rule) => {
    let score = rule.priority;
    if (placement === 'product_page') {
      if (rule.type === 'product') score += 1000;
      else if (rule.type === 'category') score += 500;
      else score += 100;
    } else {
      if (rule.type === 'cart') score += 1000;
      else if (rule.type === 'product') score += 500;
      else score += 100;
    }
    return { rule, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 4. Collect product IDs, maintaining order, removing duplicates
  const seen = new Set<string>();
  const productIds: string[] = [];

  for (const { rule } of scored) {
    for (const rp of rule.products) {
      // Don't suggest the trigger product itself
      if (productId && rp.productId === productId) continue;
      // Don't suggest products already in cart (unless checkout page where multi-qty makes sense for cheap items)
      if (cartItemIds.includes(rp.productId) && placement !== 'checkout_page') continue;
      if (seen.has(rp.productId)) continue;
      seen.add(rp.productId);
      productIds.push(rp.productId);
      if (productIds.length >= limit) break;
    }
    if (productIds.length >= limit) break;
  }

  // 5. Fetch the actual products, filtering out unavailable ones
  if (productIds.length === 0) return [];

  const products = await db.menuItem.findMany({
    where: {
      id: { in: productIds },
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
      prepTime: true,
      category: { select: { id: true, name: true } },
    },
  });

  // Maintain the original sort order from our logic
  const ordered = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as UpsellProduct[];

  return ordered.slice(0, limit);
}