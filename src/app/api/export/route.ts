import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Helper for CSV
function toCSV(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape quotes and wrap in quotes
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export async function GET() {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const passThrough = new PassThrough();

  // Pipe the archive to the PassThrough stream
  archive.pipe(passThrough);

  // We don't await the append operations here, we just start them and let archiver finalize asynchronously
  const buildArchive = async () => {
    try {
      // 1. Fetch all data
      const [
        products,
        categories,
        customers,
        orders,
        orderItems,
        returns,
        cashSessions,
        users,
        storeSettings,
        productImages
      ] = await Promise.all([
        prisma.product.findMany(),
        prisma.category.findMany(),
        prisma.customer.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
        prisma.return.findMany(),
        prisma.cashSession.findMany(),
        prisma.user.findMany(),
        prisma.storeSettings.findMany(),
        prisma.productImage.findMany()
      ]);

      const database = {
        products,
        categories,
        customers,
        orders,
        orderItems,
        returns,
        cashSessions,
        users,
        storeSettings,
        productImages
      };

      // 2. Add database.json
      archive.append(JSON.stringify(database, null, 2), { name: 'data/database.json' });

      // 3. Add CSVs
      if (products.length) archive.append(toCSV(products), { name: 'data/csv/products.csv' });
      if (categories.length) archive.append(toCSV(categories), { name: 'data/csv/categories.csv' });
      if (customers.length) archive.append(toCSV(customers), { name: 'data/csv/customers.csv' });
      if (orders.length) archive.append(toCSV(orders), { name: 'data/csv/orders.csv' });
      if (orderItems.length) archive.append(toCSV(orderItems), { name: 'data/csv/order_items.csv' });
      if (returns.length) archive.append(toCSV(returns), { name: 'data/csv/returns.csv' });
      if (cashSessions.length) archive.append(toCSV(cashSessions), { name: 'data/csv/cash_sessions.csv' });
      if (users.length) archive.append(toCSV(users), { name: 'data/csv/users.csv' });
      if (storeSettings.length) archive.append(toCSV(storeSettings), { name: 'data/csv/store_settings.csv' });
      if (productImages.length) archive.append(toCSV(productImages), { name: 'data/csv/product_images.csv' });

      // 4. Add images from public/uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'images');
      }

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error('Error building archive:', error);
      passThrough.emit('error', error);
    }
  };

  buildArchive();

  // Return the PassThrough stream as a Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      passThrough.on('data', (chunk) => controller.enqueue(chunk));
      passThrough.on('end', () => controller.close());
      passThrough.on('error', (err) => controller.error(err));
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="export-data.zip"'
    }
  });
}
