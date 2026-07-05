import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/geocode/reverse?lat=24.86&lng=67.00
 * 
 * Uses OpenStreetMap Nominatim (free, no API key) for reverse geocoding.
 * Returns a human-readable location name for display purposes only.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng query params are required' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=16&addressdetails=1&accept-language=en`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FlameGrill-App/1.0 (food-ordering-demo)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 });
  }

    const data = await res.json();
    const address = data.address || {};
    const displayName = data.display_name || '';

    const parts: string[] = [];
    if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
    if (address.city_district) parts.push(address.city_district);
    if (!parts.length && address.city) parts.push(address.city);
    if (address.road) parts.push(address.road);

    return NextResponse.json({
      displayName,
      area: address.neighbourhood || address.suburb || address.city_district || address.city || '',
      city: address.city || address.town || '',
      road: address.road || '',
      label: parts.join(', ') || displayName,
    });
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
