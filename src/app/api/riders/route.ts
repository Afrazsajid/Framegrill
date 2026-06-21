import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const riders = await db.rider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    return NextResponse.json(riders);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rider = await db.rider.create({ data: body });
    return NextResponse.json(rider, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create rider' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const rider = await db.rider.update({ where: { id }, data });
    return NextResponse.json(rider);
  } catch {
    return NextResponse.json({ error: 'Failed to update rider' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.rider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete rider' }, { status: 500 });
  }
}