import cors from "@fastify/cors";
import Fastify from "fastify";
import { seededSites, seededTechnicians, seededUsers } from "@smart-security/contracts";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.TRACKING_SERVICE_PORT ?? 4103);
const technicians = structuredClone(seededTechnicians);
const locationHistory: Array<{ technicianId: string; latitude: number; longitude: number; timestamp: string; jobId?: string }> = [];
const geofenceEvents: Array<{ technicianId: string; siteId: string; eventType: "enter" | "exit"; timestamp: string; distance: number }> = [];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "tracking-service" }));

app.get("/dashboard/tracking-summary", async () => ({
  availableTechnicians: technicians.filter((entry) => entry.availabilityStatus === "available").length,
  activeTracking: locationHistory.filter((l) => new Date(l.timestamp).getTime() > Date.now() - 3600000).length,
}));

app.get("/technicians", async () =>
  technicians.map((technician) => ({
    ...technician,
    name: seededUsers.find((entry) => entry.id === technician.userId)?.fullName ?? "Unknown",
  }))
);

app.get("/technicians/:id/location", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const tech = technicians.find((t) => t.id === params.id);
  if (!tech) throw new Error("Technician not found");
  return {
    latitude: tech.currentLat,
    longitude: tech.currentLng,
    updatedAt: tech.locationUpdatedAt,
  };
});

app.post("/technicians/:id/location", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({
    latitude: z.number(),
    longitude: z.number(),
    jobId: z.string().optional(),
    accuracy: z.number().optional(),
    batteryLevel: z.number().optional(),
  }).parse(request.body);
  const tech = technicians.find((t) => t.id === params.id);
  if (!tech) throw new Error("Technician not found");
  tech.currentLat = body.latitude;
  tech.currentLng = body.longitude;
  tech.locationUpdatedAt = new Date().toISOString();
  locationHistory.push({
    technicianId: params.id,
    latitude: body.latitude,
    longitude: body.longitude,
    timestamp: new Date().toISOString(),
    jobId: body.jobId,
  });
  return { success: true, updatedAt: tech.locationUpdatedAt };
});

app.get("/technicians/:id/history", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const { from, to } = request.query as Record<string, string>;
  let filtered = locationHistory.filter((l) => l.technicianId === params.id);
  if (from) filtered = filtered.filter((l) => new Date(l.timestamp) >= new Date(from));
  if (to) filtered = filtered.filter((l) => new Date(l.timestamp) <= new Date(to));
  return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
});

app.get("/sites", async () => seededSites);

app.get("/sites/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const site = seededSites.find((s) => s.id === params.id);
  if (!site) throw new Error("Site not found");
  return site;
});

app.get("/sites/:id/nearest-technicians", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const site = seededSites.find((entry) => entry.id === params.id);
  if (!site) {
    throw new Error("Site not found");
  }
  return technicians
    .filter((entry) => entry.availabilityStatus === "available")
    .map((entry) => ({
      technicianId: entry.id,
      name: seededUsers.find((user) => user.id === entry.userId)?.fullName ?? "Unknown",
      distanceKm: Number((haversine(entry.currentLat, entry.currentLng, site.latitude, site.longitude) / 1000).toFixed(1)),
      skillMatch: entry.skills,
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
});

app.get("/geofence/events", async (request) => {
  const { technicianId, siteId } = request.query as Record<string, string>;
  let filtered = geofenceEvents;
  if (technicianId) filtered = filtered.filter((e) => e.technicianId === technicianId);
  if (siteId) filtered = filtered.filter((e) => e.siteId === siteId);
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

app.post("/jobs/:id/check-in", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({
    latitude: z.number(),
    longitude: z.number(),
    siteId: z.string(),
  }).parse(request.params);
  const site = seededSites.find((entry) => entry.id === body.siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const distanceMeters = haversine(body.latitude, body.longitude, site.latitude, site.longitude);
  const inGeofence = distanceMeters <= site.geofenceRadius;
  if (!inGeofence) {
    geofenceEvents.push({
      technicianId: String(request.headers["x-user-id"]),
      siteId: body.siteId,
      eventType: "exit",
      timestamp: new Date().toISOString(),
      distance: Math.round(distanceMeters),
    });
  }
  return {
    jobId: params.id,
    checkedIn: inGeofence,
    distanceMeters: Math.round(distanceMeters),
    otpRequired: false,
  };
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
