import cors from "@fastify/cors";
import Fastify from "fastify";

const app = Fastify({ logger: false });
const port = Number(process.env.API_GATEWAY_PORT ?? 4000);

const services = {
  auth: process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:4101",
  dispatch: process.env.DISPATCH_SERVICE_URL ?? "http://127.0.0.1:4102",
  tracking: process.env.TRACKING_SERVICE_URL ?? "http://127.0.0.1:4103",
  inventory: process.env.INVENTORY_SERVICE_URL ?? "http://127.0.0.1:4104",
  report: process.env.REPORT_SERVICE_URL ?? "http://127.0.0.1:4105",
  notification: process.env.NOTIFICATION_SERVICE_URL ?? "http://127.0.0.1:4106",
  client: process.env.CLIENT_SERVICE_URL ?? "http://127.0.0.1:4107",
};

async function proxyJson(target: string, path: string, init?: RequestInit) {
  const response = await fetch(`${target}${path}`, init);
  const text = await response.text();
  return {
    statusCode: response.status,
    body: text,
    headers: response.headers,
  };
}

function extractUserId(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return "";
  }
  try {
    const token = authorizationHeader.slice("Bearer ".length).split(".")[1];
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    return String(payload.id ?? "");
  } catch {
    return "";
  }
}

app.register(cors, { origin: true, credentials: true });

app.get("/health", async () => ({
  ok: true,
  services,
}));

app.post("/auth/login", async (request, reply) => {
  const result = await proxyJson(services.auth, "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request.body),
  });
  reply.code(result.statusCode).header("content-type", result.headers.get("content-type") ?? "application/json");
  return result.body;
});

app.get("/dashboard/summary", async (request, reply) => {
  const auth = request.headers.authorization ?? "";
  const [dispatch, tracking, inventory, client] = await Promise.all([
    proxyJson(services.dispatch, "/dashboard/dispatch-summary", { headers: { authorization: auth } }),
    proxyJson(services.tracking, "/dashboard/tracking-summary", { headers: { authorization: auth } }),
    proxyJson(services.inventory, "/dashboard/inventory-summary", { headers: { authorization: auth } }),
    proxyJson(services.client, "/dashboard/client-summary", { headers: { authorization: auth } }),
  ]);

  const summary = {
    ...JSON.parse(dispatch.body),
    ...JSON.parse(tracking.body),
    ...JSON.parse(inventory.body),
    ...JSON.parse(client.body),
  };

  reply.code(200);
  return summary;
});

for (const [prefix, target] of [
  ["/jobs", services.dispatch],
  ["/me/jobs", services.dispatch],
  ["/sites", services.tracking],
  ["/technicians", services.tracking],
  ["/inventory", services.inventory],
  ["/clients", services.client],
  ["/reports", services.report],
  ["/notifications", services.notification],
]) {
  app.all(`${prefix}/*`, async (request, reply) => {
    const suffix = request.url.slice(prefix.length);
    const authorization = request.headers.authorization ?? "";
    const result = await proxyJson(target, `${prefix}${suffix}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        authorization,
        "x-user-id": extractUserId(authorization),
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
    });
    reply.code(result.statusCode).header("content-type", result.headers.get("content-type") ?? "application/json");
    return result.body;
  });

  app.route({
    method: ["GET", "POST", "PATCH"],
    url: prefix,
    async handler(request, reply) {
      const authorization = request.headers.authorization ?? "";
      const result = await proxyJson(target, prefix, {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          authorization,
          "x-user-id": extractUserId(authorization),
        },
        body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
      });
      reply.code(result.statusCode).header("content-type", result.headers.get("content-type") ?? "application/json");
      return result.body;
    },
  });
}

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
