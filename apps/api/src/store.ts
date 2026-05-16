import { clients, inventoryItems, jobs, serviceRequests, sites, technicians, users } from "./data.js";
import type { InventoryItem, Job, ServiceRequest, Site, Technician, User } from "./types.js";

function rankTechnicians(site: Site) {
  return technicians
    .filter((technician) => technician.availabilityStatus === "available")
    .map((technician) => {
      const distance = haversine(
        technician.currentLat,
        technician.currentLng,
        site.latitude,
        site.longitude
      );
      return {
        technician,
        distanceKm: Number((distance / 1000).toFixed(1)),
        score: distance + technician.totalJobsDone * 0.5 - technician.rating * 10,
      };
    })
    .sort((left, right) => left.score - right.score);
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export const db = {
  users,
  technicians,
  clients,
  sites,
  jobs,
  inventoryItems,
  serviceRequests,
  authenticate(email: string) {
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },
  dashboardSummary() {
    return {
      activeJobs: jobs.filter((job) => !["completed", "cancelled"].includes(job.status)).length,
      availableTechnicians: technicians.filter((technician) => technician.availabilityStatus === "available").length,
      pendingRequests: serviceRequests.filter((request) => request.status === "open").length,
      lowStockAlerts: inventoryItems.filter((item) => item.currentStock <= item.minStockLevel).length,
      dispatchTimeMinutes: 2.8,
      utilizationRate: 86,
      clientSatisfaction: 4.6,
    };
  },
  enrichedJobs() {
    return jobs.map((job) => ({
      ...job,
      client: clients.find((client) => client.id === job.clientId),
      site: sites.find((site) => site.id === job.siteId),
      technician: technicians.find((technician) => technician.id === job.assignedTechnicianId),
      technicianUser: users.find(
        (user) =>
          user.id === technicians.find((technician) => technician.id === job.assignedTechnicianId)?.userId
      ),
    }));
  },
  createJob(input: {
    clientId: string;
    siteId: string;
    createdBy: string;
    jobType: Job["jobType"];
    priority: Job["priority"];
    description: string;
    scheduledAt: string;
    autoAssign: boolean;
  }) {
    const site = sites.find((entry) => entry.id === input.siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    const job: Job = {
      id: `job-${jobs.length + 1}`,
      jobNumber: `SSE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(jobs.length + 1).padStart(3, "0")}`,
      clientId: input.clientId,
      siteId: input.siteId,
      createdBy: input.createdBy,
      jobType: input.jobType,
      status: "pending",
      priority: input.priority,
      description: input.description,
      scheduledAt: input.scheduledAt,
      otpVerified: false,
      clientSigned: false,
    };

    if (input.autoAssign) {
      const match = rankTechnicians(site)[0];
      if (match) {
        job.assignedTechnicianId = match.technician.id;
        job.status = "assigned";
        match.technician.availabilityStatus = "busy";
        match.technician.currentJobId = job.id;
      }
    }

    jobs.unshift(job);
    return job;
  },
  updateJobStatus(jobId: string, nextStatus: Job["status"]) {
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    job.status = nextStatus;
    if (nextStatus === "checked_in") {
      job.checkinAt = new Date().toISOString();
    }
    if (nextStatus === "completed") {
      job.checkoutAt = new Date().toISOString();
      job.clientSigned = true;
      job.reportUrl = `/reports/${job.id}.pdf`;
      const tech = technicians.find((entry) => entry.id === job.assignedTechnicianId);
      if (tech) {
        tech.availabilityStatus = "available";
        tech.currentJobId = undefined;
        tech.totalJobsDone += 1;
      }
    }
    return job;
  },
  nearestTechnicians(siteId: string) {
    const site = sites.find((entry) => entry.id === siteId);
    if (!site) {
      throw new Error("Site not found");
    }
    return rankTechnicians(site).map((item) => ({
      technicianId: item.technician.id,
      name: users.find((user) => user.id === item.technician.userId)?.fullName ?? "Unknown",
      distanceKm: item.distanceKm,
      skillMatch: item.technician.skills,
    }));
  },
  createRequest(input: Omit<ServiceRequest, "id" | "status" | "createdAt">) {
    const request: ServiceRequest = {
      id: `req-${serviceRequests.length + 1}`,
      status: "open",
      createdAt: new Date().toISOString(),
      ...input,
    };
    serviceRequests.unshift(request);
    return request;
  },
  addInventoryDeduction(jobId: string, itemId: string, quantity: number) {
    const item = inventoryItems.find((entry) => entry.id === itemId);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    if (item.currentStock < quantity) {
      throw new Error("Insufficient stock");
    }
    item.currentStock -= quantity;
    item.lastUsedAt = new Date().toISOString();
    const job = jobs.find((entry) => entry.id === jobId);
    return { item, job };
  },
  technicianFeed(userId: string) {
    const technician = technicians.find((entry) => entry.userId === userId);
    if (!technician) {
      throw new Error("Technician not found");
    }
    return jobs.filter((job) => job.assignedTechnicianId === technician.id);
  },
};

export type SeededStore = typeof db;
