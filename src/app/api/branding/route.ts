import { db } from '@/lib/db';
import { fallbackBranding } from '@/lib/fallback-data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json(fallbackBranding);
    }
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Failed to fetch branding, using fallback data:', error);
    return NextResponse.json(fallbackBranding);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    const updated = await db.restaurant.update({
      where: { id: restaurant.id },
      data: body,
    });
    // Clear the branding cache cookie so the inline script re-fetches
    const res = NextResponse.json(updated);
    res.headers.append('Set-Cookie', 'fg-branding=;path=/;max-age=0');
    return res;
  } catch {
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
}
