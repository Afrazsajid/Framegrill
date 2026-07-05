import { NextRequest, NextResponse } from 'next/server';
import { getUpsellProducts } from '@/lib/upsell';

// GET /api/upsells — customer-facing upsell products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = (searchParams.get('placement') || 'all') as 'product_page' | 'cart_page' | 'checkout_page' | 'all';
    const productId = searchParams.get('productId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const cartItemIdsStr = searchParams.get('cartItemIds') || '';
    const cartItemIds = cartItemIdsStr ? cartItemIdsStr.split(',').filter(Boolean) : [];
    const cartTotal = searchParams.get('cartTotal') ? parseFloat(searchParams.get('cartTotal')!) : undefined;
    const areaId = searchParams.get('areaId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 4;

    const products = await getUpsellProducts({
      placement,
      productId,
      categoryId,
      cartItemIds,
      cartTotal,
      areaId,
      limit: Math.min(limit, 4),
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch upsells' }, { status: 500 });
  }
}