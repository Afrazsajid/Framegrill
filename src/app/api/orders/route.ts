import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: { items: true, rider: true, review: true },
      });
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(order);
    }
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true, rider: true, review: true },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, ...orderData } = body;
    const orderCount = await db.order.count();
    const orderNumber = `FG-${1007 + orderCount}`;
    const order = await db.order.create({
      data: {
        ...orderData,
        orderNumber,
        items: { create: items },
      },
      include: { items: true, rider: true },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create order';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const order = await db.order.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}