import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Public: only active areas, ordered by sortOrder
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      const areas = await db.deliveryArea.findMany({ orderBy: { sortOrder: 'asc' } });
      return NextResponse.json(areas);
    }

    const areas = await db.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(areas);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const area = await db.deliveryArea.create({
      data: { name: body.name, slug, sortOrder: body.sortOrder ?? 0, isActive: body.isActive ?? true },
    });
    return NextResponse.json(area, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create area';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const area = await db.deliveryArea.update({ where: { id }, data });
    return NextResponse.json(area);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update area';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const orderCount = await db.order.count({ where: { deliveryAreaId: id } });
    if (orderCount > 0) {
      // Soft delete: deactivate instead
      await db.deliveryArea.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, deactivated: true });
    }
    await db.deliveryArea.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete area';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}