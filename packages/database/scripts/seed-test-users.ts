/**
 * Seed test users (3 testers + 4 regular users + 1 admin)
 */
import "dotenv/config";
import type { Role } from "@prisma/client";
import { applyDatabaseUrlNormalization } from "../database-url";

async function main() {
  applyDatabaseUrlNormalization();

  const { default: prisma } = await import("../index");
  const { auth } = await import("../../../apps/web/src/lib/auth");

  const testUsers: Array<{ email: string; name: string; role: Role; password: string }> = [
    // Testers (3)
    { email: "tester1@ethiotelecom.test", name: "Tester One", role: "TESTER", password: "Tester@2026" },
    { email: "tester2@ethiotelecom.test", name: "Tester Two", role: "TESTER", password: "Tester@2026" },
    { email: "tester3@ethiotelecom.test", name: "Tester Three", role: "TESTER", password: "Tester@2026" },
    // Regular Users (4)
    { email: "user1@ethiotelecom.test", name: "User One", role: "USER", password: "User@2026" },
    { email: "user2@ethiotelecom.test", name: "User Two", role: "USER", password: "User@2026" },
    { email: "user3@ethiotelecom.test", name: "User Three", role: "USER", password: "User@2026" },
    { email: "user4@ethiotelecom.test", name: "User Four", role: "USER", password: "User@2026" },
    // Admin (1)
    { email: "admin@ethiotelecom.test", name: "Administrator", role: "ADMIN", password: "Admin@2026" },
  ];

  console.log("Creating test users...\n");

  for (const userData of testUsers) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`✓ ${userData.email} (already exists)`);
        continue;
      }

      const res = await auth.api.signUpEmail({
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      });

      const userId =
        res && typeof res === "object" && "user" in res && res.user
          ? (res.user as { id: string }).id
          : null;

      if (!userId) {
        console.error(`✗ Failed to create ${userData.email}`);
        continue;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: userData.role },
      });

      console.log(`✓ ${userData.email} (${userData.role})`);
    } catch (err) {
      console.error(`✗ Error creating ${userData.email}:`, err);
    }
  }

  await prisma.$disconnect();

  console.log("\n=== TEST USER CREDENTIALS ===\n");
  console.log("TESTERS (3):");
  testUsers.slice(0, 3).forEach((u) => {
    if (u.role === "TESTER") console.log(`  ${u.email} | Password: ${u.password}`);
  });

  console.log("\nREGULAR USERS (4):");
  testUsers.slice(3, 7).forEach((u) => {
    if (u.role === "USER") console.log(`  ${u.email} | Password: ${u.password}`);
  });

  console.log("\nADMIN (1):");
  testUsers.slice(7).forEach((u) => {
    if (u.role === "ADMIN") console.log(`  ${u.email} | Password: ${u.password}`);
  });

  console.log("\nAll users created. Log in at http://localhost:3003");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
