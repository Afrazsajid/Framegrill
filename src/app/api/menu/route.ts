import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const items = await db.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variations: { orderBy: { isDefault: 'desc' } },
        addons: true,
        _count: { select: { reviews: true } },
      },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variations, addons, ...itemData } = body;
    const item = await db.menuItem.create({
      data: {
        ...itemData,
        variations: variations ? { create: variations } : undefined,
        addons: addons ? { create: addons } : undefined,
      },
      include: { variations: true, addons: true, category: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create menu item';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, variations, addons, ...itemData } = body;
    const existing = await db.menuItem.findUnique({ where: { id }, include: { variations: true, addons: true } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (variations) {
      await db.itemVariation.deleteMany({ where: { itemId: id } });
    }
    if (addons) {
      await db.itemAddon.deleteMany({ where: { itemId: id } });
    }

    const item = await db.menuItem.update({
      where: { id },
      data: {
        ...itemData,
        variations: variations ? { create: variations } : undefined,
        addons: addons ? { create: addons } : undefined,
      },
      include: { variations: true, addons: true, category: true },
    });
    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update menu item';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}