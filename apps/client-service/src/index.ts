import cors from "@fastify/cors";
import Fastify from "fastify";
import { seededClients, seededServiceRequests, seededSites, seededJobs } from "@smart-security/contracts";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.CLIENT_SERVICE_PORT ?? 4107);
const requests = structuredClone(seededServiceRequests);
const clients = structuredClone(seededClients);

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "client-service" }));

app.get("/dashboard/client-summary", async () => ({
  pendingRequests: requests.filter((entry) => entry.status === "open").length,
  activeJobs: seededJobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length,
  clientSatisfaction: 4.6,
  totalClients: clients.length,
}));

app.get("/clients", async () => {
  return clients.map((client) => ({
    ...client,
    sites: seededSites.filter((s) => s.clientId === client.id),
  }));
});

app.get("/clients/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const client = clients.find((c) => c.id === params.id);
  if (!client) throw new Error("Client not found");
  return {
    ...client,
    sites: seededSites.filter((s) => s.clientId === client.id),
  };
});

app.get("/clients/requests", async (request) => {
  const { clientId, status } = request.query as Record<string, string>;
  let filtered = requests;
  if (clientId) filtered = filtered.filter((r) => r.clientId === clientId);
  if (status) filtered = filtered.filter((r) => r.status === status);
  return filtered.map((request) => ({
    ...request,
    site: seededSites.find((entry) => entry.id === request.siteId),
    client: seededClients.find((entry) => entry.id === request.clientId),
  }));
});

app.get("/clients/requests/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const req = requests.find((r) => r.id === params.id);
  if (!req) throw new Error("Request not found");
  return {
    ...req,
    site: seededSites.find((s) => s.id === req.siteId),
    client: seededClients.find((c) => c.id === req.clientId),
    relatedJobs: seededJobs.filter((j) => j.clientId === req.clientId && j.siteId === req.siteId),
  };
});

app.post("/clients/requests", async (request) => {
  const body = z.object({
    clientId: z.string(),
    siteId: z.string(),
    requestType: z.enum(["installation", "maintenance", "survey", "fault_repair"]),
    description: z.string().min(10),
  }).parse(request.body);
  const created = {
    id: `req-${Date.now()}`,
    status: "open" as const,
    createdAt: new Date().toISOString(),
    ...body,
  };
  requests.unshift(created);
  return created;
});

app.patch("/clients/requests/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({ status: z.enum(["open", "converted", "closed"]) }).parse(request.body);
  const req = requests.find((r) => r.id === params.id);
  if (!req) throw new Error("Request not found");
  req.status = body.status;
  return req;
});

app.post("/clients/requests/:id/convert-to-job", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const req = requests.find((r) => r.id === params.id);
  if (!req) throw new Error("Request not found");
  const newJob = {
    id: `job-${Date.now()}`,
    jobNumber: `SSE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(seededJobs.length + 1).padStart(3, "0")}`,
    clientId: req.clientId,
    siteId: req.siteId,
    createdBy: "client-portal",
    jobType: req.requestType,
    status: "pending" as const,
    priority: "normal" as const,
    description: req.description,
    scheduledAt: new Date().toISOString(),
    otpVerified: false,
    clientSigned: false,
  };
  seededJobs.push(newJob);
  req.status = "converted";
  return { success: true, job: newJob, request: req };
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
