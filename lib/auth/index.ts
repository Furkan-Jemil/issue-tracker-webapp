import prisma from "@/lib/prisma";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

const defaultTrustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
];

const trustedOrigins = (
  process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((origin) =>
        origin.trim(),
      )
    : defaultTrustedOrigins
).filter(Boolean);

const dashPlugin =
  process.env.BETTER_AUTH_API_KEY != null &&
  process.env.BETTER_AUTH_API_KEY !== ""
    ? dash({
        apiUrl: process.env.BETTER_AUTH_API_URL,
        kvUrl: process.env.BETTER_AUTH_KV_URL,
        apiKey: process.env.BETTER_AUTH_API_KEY,
      })
    : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL,
  secret:
    process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustedOrigins,
  plugins: [...(dashPlugin ? [dashPlugin] : []), nextCookies()],
});
