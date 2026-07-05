import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/delivery-areas — fetch all areas, optionally match by coordinates
//
// Query params:
//   ?lat=24.86&lng=67.00   — returns the nearest matching area (or empty array)
//   (no params)             — returns all areas ordered by sortOrder
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const areas = await db.deliveryArea.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // If coordinates provided, run server-side Haversine match
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const R = 6371;
        const toRad = (d: number) => (d * Math.PI) / 180;

        const matches = areas
          .filter((a) => a.isActive && a.latitude !== null && a.longitude !== null)
          .map((a) => {
            const dLat = toRad(a.latitude! - lat);
            const dLng = toRad(a.longitude! - lng);
            const a_ =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat)) *
                Math.cos(toRad(a.latitude!)) *
                Math.sin(dLng / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a_), Math.sqrt(1 - a_));
            return { area: a, distance: dist };
          })
          .filter((m) => m.distance <= m.area.radiusKm)
          .sort((a, b) => a.distance - b.distance);

        if (matches.length > 0) {
          return NextResponse.json([matches[0].area]);
        }
        return NextResponse.json([]);
      }
    }

    return NextResponse.json(areas);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch delivery areas' }, { status: 500 });
  }
}

// POST /api/delivery-areas — create area
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, isActive, sortOrder, latitude, longitude, radiusKm } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check for duplicate slug
    const existing = await db.deliveryArea.findUnique({ where: { slug: slug.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const area = await db.deliveryArea.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        ...(latitude != null && { latitude: parseFloat(latitude) }),
        ...(longitude != null && { longitude: parseFloat(longitude) }),
        ...(radiusKm != null && { radiusKm: parseFloat(radiusKm) }),
      },
    });
    return NextResponse.json(area, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create delivery area' }, { status: 500 });
  }
}

// PUT /api/delivery-areas — update area
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, isActive, sortOrder, latitude, longitude, radiusKm } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await db.deliveryArea.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Delivery area not found' }, { status: 404 });
    }

    // If slug changed, check uniqueness
    if (slug && slug.trim() !== existing.slug) {
      const slugTaken = await db.deliveryArea.findUnique({ where: { slug: slug.trim() } });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
    }

    const area = await db.deliveryArea.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(slug != null && { slug: slug.trim().toLowerCase().replace(/\s+/g, '-') }),
        ...(isActive != null && { isActive }),
        ...(sortOrder != null && { sortOrder }),
        ...(latitude != null && { latitude: parseFloat(latitude) }),
        ...(longitude != null && { longitude: parseFloat(longitude) }),
        ...(radiusKm != null && { radiusKm: parseFloat(radiusKm) }),
      },
    });
    return NextResponse.json(area);
  } catch {
    return NextResponse.json({ error: 'Failed to update delivery area' }, { status: 500 });
  }
}

// DELETE /api/delivery-areas — delete area
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check for linked orders
    const orderCount = await db.order.count({ where: { deliveryAreaId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${orderCount} order(s) linked to this area` },
        { status: 409 },
      );
    }

    await db.deliveryArea.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete delivery area' }, { status: 500 });
  }
}