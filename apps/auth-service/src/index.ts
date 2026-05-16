import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { z } from "zod";
import { seededUsers, type User, type UserRole } from "@smart-security/contracts";

const app = Fastify({ logger: false });
const port = Number(process.env.AUTH_SERVICE_PORT ?? 4101);

const users = structuredClone(seededUsers);
const refreshTokens = new Set<string>();

app.register(cors, { origin: true, credentials: true });
app.register(jwt, { secret: process.env.JWT_SECRET ?? "smart-security-dev-secret" });

app.get("/health", async () => ({ ok: true, service: "auth-service" }));

app.post("/auth/login", async (request, reply) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).parse(request.body);
  const user = users.find((entry) => entry.email.toLowerCase() === body.email.toLowerCase());
  if (!user) {
    reply.code(401);
    return { message: "Invalid credentials" };
  }
  const accessToken = await reply.jwtSign({
    id: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  const refreshToken = crypto.randomUUID();
  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } };
});

app.post("/auth/refresh", async (request, reply) => {
  const body = z.object({
    refreshToken: z.string(),
  }).parse(request.body);
  if (!refreshTokens.has(body.refreshToken)) {
    reply.code(401);
    return { message: "Invalid refresh token" };
  }
  const decoded = request.user as { id: string; role: UserRole; email: string; fullName: string };
  const user = users.find((u) => u.id === decoded.id);
  if (!user) {
    reply.code(401);
    return { message: "User not found" };
  }
  refreshTokens.delete(body.refreshToken);
  const newRefreshToken = crypto.randomUUID();
  refreshTokens.add(newRefreshToken);
  const accessToken = await reply.jwtSign({
    id: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  return { accessToken, refreshToken: newRefreshToken };
});

app.post("/auth/logout", async (request, reply) => {
  const body = z.object({
    refreshToken: z.string().optional(),
  }).parse(request.body);
  if (body.refreshToken) {
    refreshTokens.delete(body.refreshToken);
  }
  return { success: true };
});

async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ message: "Unauthorized" });
  }
}

function authorize(...allowedRoles: UserRole[]) {
  return async (request: any, reply: any) => {
    await authenticate(request, reply);
    if (!allowedRoles.includes(request.user.role)) {
      reply.code(403).send({ message: "Forbidden" });
    }
  };
}

app.get("/users", { preHandler: authenticate }, async () => {
  return users;
});

app.get("/users/:id", { preHandler: authenticate }, async (request) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const user = users.find((u) => u.id === params.id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
});

app.get("/me", { preHandler: authenticate }, async (request: any) => {
  const { password, ...user } = users.find((u) => u.id === request.user.id) as User & { password?: string };
  return user;
});

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  console.error(error);
  process.exit(1);
});
