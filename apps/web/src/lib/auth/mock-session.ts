import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "mock.session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const raw = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "mock-secret-change-in-production";
  return new TextEncoder().encode(raw);
}

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type MockSession = {
  user: MockUser;
};

export async function createMockSessionJWT(user: MockUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyMockSessionJWT(
  token: string
): Promise<MockUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const { id, name, email, role, sub } = payload as any;
    return {
      id: id || sub,
      name: name || "",
      email: email || "",
      role: (role as Role) || "USER",
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
