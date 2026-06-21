import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, pendingOrders, completedOrders, cancelledOrders, allOrders, topItems] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'delivered' } }),
      db.order.count({ where: { status: 'cancelled' } }),
      db.order.findMany({ select: { total: true, createdAt: true, status: true } }),
      db.orderItem.groupBy({
        by: ['itemName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const todayOrders = allOrders.filter((o) => o.createdAt >= today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSales = allOrders.reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      todayOrders: todayOrders.length,
      todaySales,
      totalSales,
      topSellingItems: topItems.map((i) => ({
        name: i.itemName,
        totalSold: i._sum.quantity || 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}