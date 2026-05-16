import cors from "@fastify/cors";
import Fastify from "fastify";
import { seededInventoryItems } from "@smart-security/contracts";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.INVENTORY_SERVICE_PORT ?? 4104);
const inventory = structuredClone(seededInventoryItems);

interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  isActive: boolean;
}

interface ProcurementRequest {
  id: string;
  itemId: string;
  vendorId: string;
  quantity: number;
  status: "pending" | "approved" | "ordered" | "received" | "cancelled";
  requestedBy: string;
  requestedAt: string;
  estimatedCost?: number;
}

const vendors: Vendor[] = [
  { id: "v-1", name: "SecureTech Supplies", contactName: "Raj Malhotra", email: "raj@securetech.in", phone: "+919900001111", address: "Delhi", rating: 4.5, isActive: true },
  { id: "v-2", name: "CCTV World", contactName: "Priya Sharma", email: "priya@cctvworld.in", phone: "+919900002222", address: "Mumbai", rating: 4.2, isActive: true },
];

const procurements: ProcurementRequest[] = [];

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "inventory-service" }));

app.get("/dashboard/inventory-summary", async () => {
  const lowStock = inventory.filter((entry) => entry.currentStock <= entry.minStockLevel);
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * (item.costPrice ?? 0)), 0);
  return {
    lowStockAlerts: lowStock.length,
    totalItems: inventory.length,
    totalValue: Math.round(totalValue),
    pendingProcurements: procurements.filter((p) => p.status === "pending").length,
  };
});

app.get("/inventory", async (request) => {
  const { category, lowStock } = request.query as Record<string, string>;
  let filtered = inventory;
  if (category) filtered = filtered.filter((i) => i.category === category);
  if (lowStock === "true") filtered = filtered.filter((i) => i.currentStock <= i.minStockLevel);
  return filtered;
});

app.get("/inventory/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const item = inventory.find((i) => i.id === params.id);
  if (!item) throw new Error("Item not found");
  return item;
});

app.post("/inventory", async (request) => {
  const body = z.object({
    sku: z.string(),
    name: z.string(),
    category: z.enum(["camera", "dvr", "cable", "connector", "power", "other"]),
    unit: z.string(),
    currentStock: z.number(),
    minStockLevel: z.number(),
    costPrice: z.number().optional(),
    sellPrice: z.number().optional(),
  }).parse(request.body);
  const newItem = { id: `inv-${Date.now()}`, lastUsedAt: undefined, ...body };
  inventory.push(newItem);
  return newItem;
});

app.post("/inventory/deduct", async (request) => {
  const body = z.object({
    jobId: z.string(),
    itemId: z.string(),
    quantity: z.number().positive(),
  }).parse(request.body);
  const item = inventory.find((entry) => entry.id === body.itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }
  if (item.currentStock < body.quantity) {
    throw new Error("Insufficient stock");
  }
  item.currentStock -= body.quantity;
  item.lastUsedAt = new Date().toISOString();
  return { jobId: body.jobId, item };
});

app.post("/inventory/adjust", async (request) => {
  const body = z.object({
    itemId: z.string(),
    quantity: z.number(),
    reason: z.string(),
  }).parse(request.body);
  const item = inventory.find((i) => i.id === body.itemId);
  if (!item) throw new Error("Item not found");
  item.currentStock += body.quantity;
  item.lastUsedAt = new Date().toISOString();
  return { item, adjustment: body.quantity, reason: body.reason };
});

app.get("/vendors", async () => vendors.filter((v) => v.isActive));

app.get("/vendors/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const vendor = vendors.find((v) => v.id === params.id);
  if (!vendor) throw new Error("Vendor not found");
  return vendor;
});

app.get("/procurements", async (request) => {
  const { status } = request.query as Record<string, string>;
  let filtered = procurements;
  if (status) filtered = filtered.filter((p) => p.status === status);
  return filtered.map((p) => ({ ...p, item: inventory.find((i) => i.id === p.itemId), vendor: vendors.find((v) => v.id === p.vendorId) }));
});

app.post("/procurements", async (request) => {
  const body = z.object({
    itemId: z.string(),
    vendorId: z.string(),
    quantity: z.number().positive(),
    requestedBy: z.string(),
  }).parse(request.body);
  const item = inventory.find((i) => i.id === body.itemId);
  if (!item) throw new Error("Item not found");
  const vendor = vendors.find((v) => v.id === body.vendorId);
  if (!vendor) throw new Error("Vendor not found");
  const newProc: ProcurementRequest = {
    id: `proc-${Date.now()}`,
    ...body,
    status: "pending",
    requestedAt: new Date().toISOString(),
    estimatedCost: (item.costPrice ?? 0) * body.quantity,
  };
  procurements.push(newProc);
  return { ...newProc, item, vendor };
});

app.patch("/procurements/:id/status", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({ status: z.enum(["pending", "approved", "ordered", "received", "cancelled"]) }).parse(request.body);
  const proc = procurements.find((p) => p.id === params.id);
  if (!proc) throw new Error("Procurement not found");
  proc.status = body.status;
  if (body.status === "received") {
    const item = inventory.find((i) => i.id === proc.itemId);
    if (item) item.currentStock += proc.quantity;
  }
  return proc;
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
