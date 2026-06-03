/**
 * Create an admin user via Better Auth (correct password hash) or promote existing user to ADMIN.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-secure-password' ADMIN_NAME="Your Name" npx tsx scripts/create-admin-user.ts
 *
 * Or: npm run create-admin
 * (set the env vars in your shell first)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { applyDatabaseUrlNormalization } from "@/lib/database-url";

async function main() {
  const EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const PASSWORD = process.env.ADMIN_PASSWORD;
  const DISPLAY_NAME = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script.",
    );
  }

  applyDatabaseUrlNormalization();

  const { default: prisma } = await import("@/lib/prisma");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { email: EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", password: passwordHash },
    });
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: { in: ["credential", "email"] } },
    });
    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash, providerId: existingAccount.providerId || "credential", accountId: existingAccount.accountId || existing.id },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: existing.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }
    console.log(`User already exists: ${EMAIL}`);
    console.log("Role updated to ADMIN. Sign in with your existing password.");
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: DISPLAY_NAME,
      email: EMAIL,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  console.log("Admin user created successfully.");
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Role:  ADMIN`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
