import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

interface DeductItemsPayload {
  jobId: string;
  items: { itemId: string; quantity: number }[];
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  category: string;
}

async function connectRedis() {
  await redisClient.connect();
}

export async function deductInventory(jobId: string, items: { itemId: string; quantity: number }[]): Promise<{ success: boolean; message: string }> {
  const session = await prisma.$transaction(async (tx) => {
    const results: { item: InventoryItem; quantity: number }[] = [];

    for (const item of items) {
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: item.itemId },
      });

      if (!inventoryItem) {
        throw new Error(`Item not found: ${item.itemId}`);
      }

      if (inventoryItem.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.currentStock}, Requested: ${item.quantity}`);
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.itemId },
        data: {
          currentStock: { decrement: item.quantity },
        },
      });

      await tx.jobMaterial.create({
        data: {
          jobId,
          materialId: item.itemId,
          quantity: item.quantity,
        },
      });

      results.push({ item: updatedItem, quantity: item.quantity });

      if (updatedItem.currentStock <= updatedItem.minStockLevel) {
        await redisClient.publish('low_stock', JSON.stringify({
          itemId: updatedItem.id,
          itemName: updatedItem.name,
          sku: updatedItem.sku,
          currentStock: updatedItem.currentStock,
          minStockLevel: updatedItem.minStockLevel,
        }));
      }
    }

    return results;
  });

  return { success: true, message: `Deducted ${items.length} items for job ${jobId}` };
}

export async function getInventory(options: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
}) {
  const { category, search, page = 1, limit = 20, lowStockOnly } = options;

  const where: Prisma.InventoryItemWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (lowStockOnly) {
    where.currentStock = { lte: prisma.inventoryItem.fields.minStockLevel };
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adjustInventory(itemId: string, adjustment: number, reason: string, adjustedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    const newStock = item.currentStock + adjustment;

    if (newStock < 0) {
      throw new Error('Adjustment would result in negative stock');
    }

    const updatedItem = await tx.inventoryItem.update({
      where: { id: itemId },
      data: { currentStock: newStock },
    });

    await tx.inventoryAuditLog.create({
      data: {
        itemId,
        previousStock: item.currentStock,
        newStock,
        adjustment,
        reason,
        adjustedBy,
      },
    });

    if (updatedItem.currentStock <= updatedItem.minStockLevel) {
      await redisClient.publish('low_stock', JSON.stringify({
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        currentStock: updatedItem.currentStock,
        minStockLevel: updatedItem.minStockLevel,
      }));
    }

    return updatedItem;
  });
}

export async function getInventoryUsage(params: {
  from?: string;
  to?: string;
  jobId?: string;
  technicianId?: string;
}) {
  const { from, to, jobId, technicianId } = params;

  const where: Prisma.JobMaterialWhereInput = {};

  if (jobId) {
    where.jobId = jobId;
  }

  if (from && to) {
    where.job = {
      completedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    };
  }

  if (technicianId) {
    where.job = {
      ...where.job,
      technicianUserId: technicianId,
    };
  }

  const usage = await prisma.jobMaterial.groupBy({
    by: ['materialId'],
    where,
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
  });

  const materialIds = usage.map((u) => u.materialId);
  const materials = await prisma.inventoryItem.findMany({
    where: { id: { in: materialIds } },
  });

  const materialMap = new Map(materials.map((m) => [m.id, m]));

  return usage.map((u) => ({
    item: materialMap.get(u.materialId),
    quantityUsed: u._sum.quantity || 0,
  }));
}

export async function sendLowStockNotification(itemId: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.currentStock > item.minStockLevel) {
    return;
  }

  const admins = await prisma.user.findMany({
    where: { role: 'super_admin' },
  });

  for (const admin of admins) {
    console.log(`Sending low stock notification to admin: ${admin.email}`);
  }
}

redisClient.subscribe('low_stock', (message) => {
  const data = JSON.parse(message);
  console.log('Low stock alert:', data);
  sendLowStockNotification(data.itemId);
});

export default {
  deductInventory,
  getInventory,
  adjustInventory,
  getInventoryUsage,
  connectRedis,
};