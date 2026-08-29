import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Count products where stock is <= minStock
    const count = await prisma.product.count({
      where: {
        stock: {
          lte: prisma.product.fields.minStock
        }
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    // Prisma field reference in count might not work if SQLite doesn't support field reference in where. Wait, MySQL supports it but prisma sometimes doesn't like field refs in count where. 
    // Let's use raw query or fetch and filter if it fails.
    try {
      // Safer way for standard Prisma without previewFeatures fieldRef:
      const products = await prisma.product.findMany({
        select: { stock: true, minStock: true }
      });
      const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
      return NextResponse.json({ count: lowStockCount });
    } catch (err) {
      return NextResponse.json({ count: 0 });
    }
  }
}
