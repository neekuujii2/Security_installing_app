import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";

const app = Fastify({ logger: false });
const port = Number(process.env.NOTIFICATION_SERVICE_PORT ?? 4106);

interface Notification {
  id: string;
  userId: string;
  channel: "email" | "sms" | "whatsapp" | "push";
  subject?: string;
  message: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
  sentAt?: string;
}

const notifications: Notification[] = [
  { id: "notif-1", userId: "user-tech-1", channel: "push", message: "New job assigned: National Trust Bank", status: "sent", createdAt: new Date().toISOString(), sentAt: new Date().toISOString() },
  { id: "notif-2", userId: "user-client", channel: "email", subject: "Job Completed", message: "Your service request has been completed.", status: "sent", createdAt: new Date().toISOString(), sentAt: new Date().toISOString() },
];

app.register(cors, { origin: true, credentials: true });
app.get("/health", async () => ({ ok: true, service: "notification-service" }));

app.get("/notifications", async (request) => {
  const { userId, channel, status } = request.query as Record<string, string>;
  let filtered = notifications;
  if (userId) filtered = filtered.filter((n) => n.userId === userId);
  if (channel) filtered = filtered.filter((n) => n.channel === channel);
  if (status) filtered = filtered.filter((n) => n.status === status);
  return filtered;
});

app.post("/notifications/send", async (request) => {
  const body = z.object({
    userId: z.string(),
    channel: z.enum(["email", "sms", "whatsapp", "push"]),
    subject: z.string().optional(),
    message: z.string().min(1),
  }).parse(request.body);
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    ...body,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  let sent = false;
  if (body.channel === "email") {
    console.log(`[EMAIL STUB] To: ${body.userId}, Subject: ${body.subject ?? "Notification"}, Body: ${body.message}`);
    sent = true;
  } else if (body.channel === "sms") {
    console.log(`[SMS STUB] To: ${body.userId}, Message: ${body.message}`);
    sent = true;
  } else if (body.channel === "whatsapp") {
    console.log(`[WHATSAPP STUB] To: ${body.userId}, Message: ${body.message}`);
    sent = true;
  } else if (body.channel === "push") {
    console.log(`[PUSH STUB] To: ${body.userId}, Message: ${body.message}`);
    sent = true;
  }
  notification.status = sent ? "sent" : "failed";
  if (sent) notification.sentAt = new Date().toISOString();
  notifications.unshift(notification);
  return { success: sent, notification };
});

app.post("/notifications/job-assigned", async (request) => {
  const body = z.object({
    technicianId: z.string(),
    jobId: z.string(),
    jobNumber: z.string(),
    clientName: z.string(),
    siteAddress: z.string(),
  }).parse(request.body);
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    userId: body.technicianId,
    channel: "push",
    message: `New job #${body.jobNumber} assigned: ${body.clientName} - ${body.siteAddress}`,
    status: "sent",
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  return { success: true, notification };
});

app.post("/notifications/job-completed", async (request) => {
  const body = z.object({
    clientId: z.string(),
    jobId: z.string(),
    jobNumber: z.string(),
  }).parse(request.body);
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    userId: body.clientId,
    channel: "email",
    subject: "Job Completed",
    message: `Your service request #${body.jobNumber} has been completed successfully.`,
    status: "sent",
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  return { success: true, notification };
});

app.post("/notifications/low-stock", async (request) => {
  const body = z.object({
    adminUserId: z.string(),
    itemName: z.string(),
    currentStock: z.number(),
    minLevel: z.number(),
  }).parse(request.body);
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    userId: body.adminUserId,
    channel: "push",
    message: `Low stock alert: ${body.itemName} (${body.currentStock} remaining, min: ${body.minLevel})`,
    status: "sent",
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  return { success: true, notification };
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
