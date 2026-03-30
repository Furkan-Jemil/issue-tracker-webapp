/**
 * Create an admin user via Better Auth (correct password hash) or promote existing user to ADMIN.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-secure-password' ADMIN_NAME="Your Name" npx tsx scripts/create-admin-user.ts
 *
 * Or: npm run create-admin
 * (set the env vars in your shell first)
 */
import "dotenv/config";

function normalizeDatabaseUrl() {
  const u = process.env.DATABASE_URL;
  if (!u) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }
  if (u.includes("channel_binding=require")) {
    process.env.DATABASE_URL = u.replace("&channel_binding=require", "");
  }
}

async function main() {
  const EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const PASSWORD = process.env.ADMIN_PASSWORD;
  const DISPLAY_NAME = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script.",
    );
  }

  normalizeDatabaseUrl();

  const { default: prisma } = await import("@/lib/prisma");
  const { auth } = await import("@/lib/auth");

  const existing = await prisma.user.findUnique({
    where: { email: EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
    });
    console.log(`User already exists: ${EMAIL}`);
    console.log("Role updated to ADMIN. Sign in with your existing password.");
    await prisma.$disconnect();
    return;
  }

  const res = await auth.api.signUpEmail({
    body: {
      name: DISPLAY_NAME,
      email: EMAIL,
      password: PASSWORD,
    },
  });

  const userId =
    res && typeof res === "object" && "user" in res && res.user
      ? (res.user as { id: string }).id
      : null;

  if (!userId) {
    console.error("signUpEmail response:", res);
    throw new Error("signUpEmail did not return a user id");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
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
