import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { z } from "zod";
import { db, haversine } from "./store.js";
import type { UserRole } from "./types.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: string;
      role: UserRole;
      email: string;
      fullName: string;
    };
  }
}

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors, { origin: true, credentials: true });
  app.register(sensible);
  app.register(jwt, { secret: process.env.JWT_SECRET ?? "smart-security-dev-secret" });

  app.decorate("authenticate", async function authenticate(request: any, reply: any) {
    await request.jwtVerify();
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/auth/login", async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const { email } = schema.parse(request.body);
    const user = db.authenticate(email);

    if (!user) {
      return reply.unauthorized("Invalid credentials");
    }

    const token = await reply.jwtSign({
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      token,
      user,
    };
  });

  app.get("/dashboard/summary", { preHandler: [(app as any).authenticate] }, async () => {
    return db.dashboardSummary();
  });

  app.get("/jobs", { preHandler: [(app as any).authenticate] }, async () => {
    return db.enrichedJobs();
  });

  app.post("/jobs", { preHandler: [(app as any).authenticate] }, async (request) => {
    const schema = z.object({
      clientId: z.string(),
      siteId: z.string(),
      createdBy: z.string(),
      jobType: z.enum(["installation", "maintenance", "survey", "fault_repair"]),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      description: z.string().min(10),
      scheduledAt: z.string(),
      autoAssign: z.boolean().default(true),
    });

    return db.createJob(schema.parse(request.body));
  });

  app.patch("/jobs/:id/status", { preHandler: [(app as any).authenticate] }, async (request) => {
    const schema = z.object({
      status: z.enum(["pending", "assigned", "en_route", "checked_in", "in_progress", "completed", "cancelled"]),
    });
    const params = z.object({ id: z.string() }).parse(request.params);
    return db.updateJobStatus(params.id, schema.parse(request.body).status);
  });

  app.get("/jobs/:id/otp-status", { preHandler: [(app as any).authenticate] }, async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const job = db.jobs.find((entry) => entry.id === params.id);
    if (!job) {
      throw app.httpErrors.notFound("Job not found");
    }
    const client = db.clients.find((entry) => entry.id === job.clientId);
    return {
      otpRequired: Boolean(client?.isHighSecurity),
      otpVerified: job.otpVerified,
    };
  });

  app.post("/jobs/:id/check-in", { preHandler: [(app as any).authenticate] }, async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).parse(request.body);

    const job = db.jobs.find((entry) => entry.id === params.id);
    if (!job) {
      throw app.httpErrors.notFound("Job not found");
    }

    const site = db.sites.find((entry) => entry.id === job.siteId);
    if (!site) {
      throw app.httpErrors.notFound("Site not found");
    }

    const distanceMeters = haversine(body.latitude, body.longitude, site.latitude, site.longitude);
    if (distanceMeters > site.geofenceRadius) {
      throw app.httpErrors.forbidden(`Technician is outside geofence by ${Math.round(distanceMeters)} meters`);
    }

    const updated = db.updateJobStatus(job.id, "checked_in");
    return {
      job: updated,
      otpRequired: db.clients.find((entry) => entry.id === job.clientId)?.isHighSecurity ?? false,
      distanceMeters: Math.round(distanceMeters),
    };
  });

  app.post("/jobs/:id/verify-otp", { preHandler: [(app as any).authenticate] }, async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ otp: z.string().length(6) }).parse(request.body);
    const job = db.jobs.find((entry) => entry.id === params.id);
    if (!job) {
      throw app.httpErrors.notFound("Job not found");
    }
    if (body.otp !== "123456") {
      throw app.httpErrors.badRequest("Invalid OTP");
    }
    job.otpVerified = true;
    job.status = "in_progress";
    return job;
  });

  app.get("/technicians", { preHandler: [(app as any).authenticate] }, async () => {
    return db.technicians.map((technician) => ({
      ...technician,
      name: db.users.find((user) => user.id === technician.userId)?.fullName ?? "Unknown",
    }));
  });

  app.get("/sites/:id/nearest-technicians", { preHandler: [(app as any).authenticate] }, async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return db.nearestTechnicians(params.id);
  });

  app.get("/inventory", { preHandler: [(app as any).authenticate] }, async () => {
    return db.inventoryItems;
  });

  app.post("/inventory/deduct", { preHandler: [(app as any).authenticate] }, async (request) => {
    const body = z.object({
      jobId: z.string(),
      itemId: z.string(),
      quantity: z.number().positive(),
    }).parse(request.body);
    return db.addInventoryDeduction(body.jobId, body.itemId, body.quantity);
  });

  app.get("/clients/requests", { preHandler: [(app as any).authenticate] }, async () => {
    return db.serviceRequests.map((request) => ({
      ...request,
      site: db.sites.find((entry) => entry.id === request.siteId),
      client: db.clients.find((entry) => entry.id === request.clientId),
    }));
  });

  app.post("/clients/requests", { preHandler: [(app as any).authenticate] }, async (request) => {
    const body = z.object({
      clientId: z.string(),
      siteId: z.string(),
      requestType: z.enum(["installation", "maintenance", "survey", "fault_repair"]),
      description: z.string().min(10),
    }).parse(request.body);
    return db.createRequest(body);
  });

  app.get("/me/jobs", { preHandler: [(app as any).authenticate] }, async (request: any) => {
    return db.technicianFeed(request.user.id).map((job) => ({
      ...job,
      site: db.sites.find((entry) => entry.id === job.siteId),
      client: db.clients.find((entry) => entry.id === job.clientId),
    }));
  });

  app.get("/reports", { preHandler: [(app as any).authenticate] }, async () => {
    return db.jobs
      .filter((job) => job.reportUrl)
      .map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        reportUrl: job.reportUrl,
        client: db.clients.find((entry) => entry.id === job.clientId)?.organizationName,
        site: db.sites.find((entry) => entry.id === job.siteId)?.siteName,
      }));
  });

  return app;
}
