import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, ...credentials } = body;

    // Mock authentication
    if (role === 'admin') {
      if (credentials.email === 'admin@flamegrill.com' && credentials.password === 'admin123') {
        return NextResponse.json({
          id: 'admin-001',
          name: 'Admin User',
          email: 'admin@flamegrill.com',
          role: 'admin',
        });
      }
    }

    if (role === 'rider') {
      const { db } = await import('@/lib/db');
      const rider = await db.rider.findFirst({
        where: { phone: credentials.phone || '', password: credentials.password },
      });
      if (rider) {
        return NextResponse.json({
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          email: rider.email,
          role: 'rider',
        });
      }
    }

    if (role === 'customer') {
      // Guest login always works
      return NextResponse.json({
        id: `customer-${Date.now()}`,
        name: credentials.name || 'Guest',
        phone: credentials.phone || '',
        email: credentials.email || '',
        role: 'customer',
      });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}