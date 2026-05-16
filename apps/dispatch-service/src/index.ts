import cors from "@fastify/cors";
import Fastify from "fastify";
import { seededClients, seededJobs, seededSites, seededTechnicians, seededUsers, type Job, type JobSurvey } from "@smart-security/contracts";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.DISPATCH_SERVICE_PORT ?? 4102);
const jobs = structuredClone(seededJobs);
const technicians = structuredClone(seededTechnicians);

function enrich(job: Job) {
  const technician = technicians.find((entry) => entry.id === job.assignedTechnicianId);
  return {
    ...job,
    client: seededClients.find((entry) => entry.id === job.clientId),
    site: seededSites.find((entry) => entry.id === job.siteId),
    technician,
    technicianUser: seededUsers.find((entry) => entry.id === technician?.userId),
  };
}

function findBestTechnician(jobType: string, priority: string): typeof technicians[0] | undefined {
  const priorityWeight = { urgent: 4, high: 3, normal: 2, low: 1 };
  return technicians
    .filter((t) => t.availabilityStatus === "available")
    .sort((a, b) => {
      const aRating = a.rating ?? 0;
      const bRating = b.rating ?? 0;
      if (priority === "urgent" || priority === "high") {
        const aUrgent = a.skills.includes(jobType) ? 10 : 0;
        const bUrgent = b.skills.includes(jobType) ? 10 : 0;
        return (bRating + bUrgent) - (aRating + aUrgent);
      }
      return bRating - aRating;
    })[0];
}

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "dispatch-service" }));

app.get("/dashboard/dispatch-summary", async () => {
  const urgentJobs = jobs.filter((j) => j.priority === "urgent" && !["completed", "cancelled"].includes(j.status)).length;
  return {
    activeJobs: jobs.filter((job) => !["completed", "cancelled"].includes(job.status)).length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    urgentJobs,
    dispatchTimeMinutes: 2.8,
    utilizationRate: 86,
  };
});

app.get("/jobs", async (request) => {
  const { status, priority, jobType } = request.query as Record<string, string>;
  let filtered = jobs;
  if (status) filtered = filtered.filter((j) => j.status === status);
  if (priority) filtered = filtered.filter((j) => j.priority === priority);
  if (jobType) filtered = filtered.filter((j) => j.jobType === jobType);
  return filtered.map(enrich);
});

app.get("/jobs/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const job = jobs.find((j) => j.id === params.id);
  if (!job) throw new Error("Job not found");
  return enrich(job);
});

app.get("/me/jobs", async (request) => {
  const userId = String(request.headers["x-user-id"] ?? "");
  const technician = technicians.find((entry) => entry.userId === userId);
  return jobs.filter((job) => job.assignedTechnicianId === technician?.id).map(enrich);
});

app.post("/jobs", async (request) => {
  const body = z.object({
    clientId: z.string(),
    siteId: z.string(),
    createdBy: z.string(),
    jobType: z.enum(["installation", "maintenance", "survey", "fault_repair"]),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    description: z.string().min(10),
    scheduledAt: z.string(),
    autoAssign: z.boolean().default(true),
  }).parse(request.body);

  const assignedTech = body.autoAssign ? findBestTechnician(body.jobType, body.priority) : undefined;
  const newJob: Job = {
    id: `job-${Date.now()}`,
    jobNumber: `SSE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(jobs.length + 1).padStart(3, "0")}`,
    clientId: body.clientId,
    siteId: body.siteId,
    createdBy: body.createdBy,
    jobType: body.jobType,
    status: assignedTech ? "assigned" : "pending",
    priority: body.priority,
    description: body.description,
    scheduledAt: body.scheduledAt,
    assignedTechnicianId: assignedTech?.id,
    otpVerified: false,
    clientSigned: false,
  };

  if (assignedTech) {
    assignedTech.availabilityStatus = "busy";
    assignedTech.currentJobId = newJob.id;
  }

  jobs.unshift(newJob);
  return enrich(newJob);
});

app.patch("/jobs/:id/status", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({
    status: z.enum(["pending", "assigned", "en_route", "checked_in", "in_progress", "completed", "cancelled"]),
  }).parse(request.body);
  const job = jobs.find((entry) => entry.id === params.id);
  if (!job) {
    throw new Error("Job not found");
  }
  job.status = body.status;
  if (body.status === "checked_in") {
    job.checkinAt = new Date().toISOString();
  }
  if (body.status === "completed") {
    job.checkoutAt = new Date().toISOString();
    job.clientSigned = true;
    job.reportUrl = `/reports/${job.id}.pdf`;
    const technician = technicians.find((entry) => entry.id === job.assignedTechnicianId);
    if (technician) {
      technician.availabilityStatus = "available";
      technician.currentJobId = undefined;
      technician.totalJobsDone += 1;
    }
  }
  return enrich(job);
});

app.post("/jobs/:id/survey", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({
    cameraCount: z.number().optional(),
    dvrModel: z.string().optional(),
    cableLengthMeters: z.number().optional(),
    powerPoints: z.number().optional(),
    networkPoints: z.number().optional(),
    technicianNotes: z.string().optional(),
    beforePhotos: z.array(z.string()).optional(),
    afterPhotos: z.array(z.string()).optional(),
    clientSignatureUrl: z.string().optional(),
  }).parse(request.body);
  const job = jobs.find((j) => j.id === params.id);
  if (!job) throw new Error("Job not found");
  job.survey = body as JobSurvey;
  return enrich(job);
});

app.get("/jobs/:id/otp-status", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const job = jobs.find((entry) => entry.id === params.id);
  if (!job) {
    throw new Error("Job not found");
  }
  const client = seededClients.find((entry) => entry.id === job.clientId);
  return {
    otpRequired: Boolean(client?.isHighSecurity),
    otpVerified: job.otpVerified,
  };
});

app.post("/jobs/:id/verify-otp", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({ otp: z.string().length(6) }).parse(request.body);
  const job = jobs.find((entry) => entry.id === params.id);
  if (!job) {
    throw new Error("Job not found");
  }
  if (body.otp !== "123456") {
    throw new Error("Invalid OTP");
  }
  job.otpVerified = true;
  job.status = "in_progress";
  return enrich(job);
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
