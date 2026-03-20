import { BetterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = BetterAuth({
  adapter: "prisma",
  prisma,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // Attach user role to session for RBAC
      if (user) {
        session.user.role = user.role;
        session.user.id = user.id;
      }
      return session;
    },
  },
});
