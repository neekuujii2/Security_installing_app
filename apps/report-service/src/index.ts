import cors from "@fastify/cors";
import Fastify from "fastify";
import { seededClients, seededJobs, seededSites, seededTechnicians, seededUsers } from "@smart-security/contracts";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.REPORT_SERVICE_PORT ?? 4105);
const jobs = structuredClone(seededJobs);

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "report-service" }));

app.get("/reports", async () =>
  jobs
    .filter((job) => job.status === "completed")
    .map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      reportUrl: job.reportUrl,
      client: seededClients.find((entry) => entry.id === job.clientId)?.organizationName,
      site: seededSites.find((entry) => entry.id === job.siteId)?.siteName,
      completedAt: job.checkoutAt,
    }))
);

app.get("/reports/:id", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const job = jobs.find((j) => j.id === params.id);
  if (!job) throw new Error("Job not found");
  const client = seededClients.find((c) => c.id === job.clientId);
  const site = seededSites.find((s) => s.id === job.siteId);
  const tech = seededTechnicians.find((t) => t.id === job.assignedTechnicianId);
  const techUser = tech ? seededUsers.find((u) => u.id === tech.userId) : null;
  return {
    job,
    client,
    site,
    technician: (techUser && tech) ? { name: techUser.fullName, employeeId: tech.employeeId, rating: tech.rating } : null,
  };
});

app.post("/reports/:id/generate", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const job = jobs.find((j) => j.id === params.id);
  if (!job) throw new Error("Job not found");
  if (job.status !== "completed") throw new Error("Job must be completed to generate report");
  const reportData = {
    jobNumber: job.jobNumber,
    jobType: job.jobType,
    description: job.description,
    client: seededClients.find((c) => c.id === job.clientId)?.organizationName,
    site: seededSites.find((s) => s.id === job.siteId),
    survey: job.survey,
    checkinAt: job.checkinAt,
    checkoutAt: job.checkoutAt,
  };
  const pdfUrl = `/api/reports/download/${job.id}.pdf`;
  job.reportUrl = pdfUrl;
  return { success: true, reportUrl: pdfUrl, reportData };
});

app.get("/reports/download/:id.pdf", async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const job = jobs.find((j) => j.id === params.id);
  if (!job || !job.reportUrl) throw new Error("Report not found");
  return { message: "PDF generation stub - integrate with PDFKit or similar", jobId: job.id };
});

app.get("/reports/templates", async () => [
  { id: "installation", name: "Installation Report", fields: ["cameraCount", "dvrModel", "cableLength", "beforePhotos", "afterPhotos", "clientSignature"] },
  { id: "maintenance", name: "Maintenance Report", fields: ["issuesFound", "resolutions", "partsReplaced", "clientSignature"] },
  { id: "survey", name: "Survey Report", fields: ["siteAssessment", "recommendations", "costEstimate", "timeline"] },
]);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
