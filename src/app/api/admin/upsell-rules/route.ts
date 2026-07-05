import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/upsell-rules — list all rules with products
export async function GET() {
  try {
    const rules = await db.upsellRule.findMany({
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        triggerProduct: { select: { id: true, name: true } },
        triggerCategory: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } },
      },
      orderBy: { priority: 'desc' },
    });
    return NextResponse.json(rules);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch upsell rules' }, { status: 500 });
  }
}

// POST /api/admin/upsell-rules — create rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, triggerProductId, triggerCategoryId, placement, productIds, minCartValue, maxCartValue, areaId, priority, isActive } = body;

    // Validation
    if (!name?.trim()) return NextResponse.json({ error: 'Rule name is required' }, { status: 400 });
    if (!['product', 'category', 'cart', 'global'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    if (!['product_page', 'cart_page', 'checkout_page', 'all'].includes(placement)) return NextResponse.json({ error: 'Invalid placement' }, { status: 400 });
    if (type === 'product' && !triggerProductId) return NextResponse.json({ error: 'Trigger product is required for product rules' }, { status: 400 });
    if (type === 'category' && !triggerCategoryId) return NextResponse.json({ error: 'Trigger category is required for category rules' }, { status: 400 });
    if (!Array.isArray(productIds) || productIds.length === 0) return NextResponse.json({ error: 'At least one upsell product is required' }, { status: 400 });

    // Prevent trigger product being an upsell product
    if (type === 'product' && productIds.includes(triggerProductId)) {
      return NextResponse.json({ error: 'Upsell product cannot be the same as the trigger product' }, { status: 400 });
    }

    const rule = await db.upsellRule.create({
      data: {
        name: name.trim(),
        type,
        triggerProductId: triggerProductId || null,
        triggerCategoryId: triggerCategoryId || null,
        placement,
        minCartValue: minCartValue ?? null,
        maxCartValue: maxCartValue ?? null,
        areaId: areaId || null,
        priority: typeof priority === 'number' ? priority : 0,
        isActive: isActive ?? true,
        products: {
          create: productIds.map((pid: string, i: number) => ({
            productId: pid,
            sortOrder: i,
          })),
        },
      },
      include: {
        products: { include: { product: { select: { id: true, name: true, price: true } } } },
        triggerProduct: { select: { id: true, name: true } },
        triggerCategory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create rule';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/upsell-rules — update rule
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, triggerProductId, triggerCategoryId, placement, productIds, minCartValue, maxCartValue, areaId, priority, isActive } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const existing = await db.upsellRule.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    if (name?.trim()) {
      if (!name.trim()) return NextResponse.json({ error: 'Rule name cannot be empty' }, { status: 400 });
    }
    if (type === 'product' && !triggerProductId) return NextResponse.json({ error: 'Trigger product is required for product rules' }, { status: 400 });
    if (type === 'category' && !triggerCategoryId) return NextResponse.json({ error: 'Trigger category is required for category rules' }, { status: 400 });

    // If productIds provided, replace them
    if (Array.isArray(productIds)) {
      await db.upsellRuleProduct.deleteMany({ where: { upsellRuleId: id } });
      if (productIds.length > 0) {
        await db.upsellRuleProduct.createMany({
          data: productIds.map((pid: string, i: number) => ({
            upsellRuleId: id,
            productId: pid,
            sortOrder: i,
          })),
        });
      }
    }

    const rule = await db.upsellRule.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(type != null && { type }),
        ...(triggerProductId !== undefined && { triggerProductId: triggerProductId || null }),
        ...(triggerCategoryId !== undefined && { triggerCategoryId: triggerCategoryId || null }),
        ...(placement != null && { placement }),
        ...(minCartValue !== undefined && { minCartValue: minCartValue ?? null }),
        ...(maxCartValue !== undefined && { maxCartValue: maxCartValue ?? null }),
        ...(areaId !== undefined && { areaId: areaId || null }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        products: { include: { product: { select: { id: true, name: true, price: true } } } },
        triggerProduct: { select: { id: true, name: true } },
        triggerCategory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(rule);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update rule';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/upsell-rules?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await db.upsellRuleProduct.deleteMany({ where: { upsellRuleId: id } });
    await db.upsellRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}