/**
 * Master seed script:
 * - Sets furkanjemil54@gmail.com as ADMIN (creates if not existing).
 * - Creates 4 regular users and 3 testers.
 * - Seeds issues with different statuses (OPEN, IN_PROGRESS, RESOLVED, CLOSED).
 * - Attaches links (url), file attachments (Attachment), and images (Screenshot) to each issue.
 */
import "dotenv/config";
import type { Role, IssueType, Priority, Severity, IssueStatus } from "@prisma/client";
import { applyDatabaseUrlNormalization } from "../database-url";

async function main() {
  applyDatabaseUrlNormalization();

  const { default: prisma } = await import("../index");
  const { auth } = await import("../../../apps/web/src/lib/auth");

  console.log("=== SEEDING DATABASE ===\n");

  // 1. Configure furkanjemil54@gmail.com as ADMIN
  const adminEmail = "furkanjemil54@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("✗ ADMIN_PASSWORD environment variable is not set. Set it before seeding:\n  ADMIN_PASSWORD='your-secure-password' npx tsx packages/database/scripts/seed-everything.ts");
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: "ADMIN" },
    });
    console.log(`✓ Promoted existing user ${adminEmail} to ADMIN.`);
  } else {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          name: "Furkan Jemil",
          email: adminEmail,
          password: adminPassword,
        },
      });
      const userId =
        res && typeof res === "object" && "user" in res && res.user
          ? (res.user as { id: string }).id
          : null;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { role: "ADMIN" },
        });
        console.log(`✓ Created new ADMIN user: ${adminEmail}`);
      }
    } catch (e) {
      console.error(`✗ Error creating admin ${adminEmail}:`, e);
    }
  }

  // 2. Define 4 Users and 3 Testers
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
  ];

  const userIdsByEmail: Record<string, string> = {};

  for (const userData of testUsers) {
    let userId = "";
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: userData.role },
      });
      userId = existing.id;
      console.log(`✓ User ${userData.email} updated to role ${userData.role}`);
    } else {
      try {
        const res = await auth.api.signUpEmail({
          body: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
          },
        });
        const createdId =
          res && typeof res === "object" && "user" in res && res.user
            ? (res.user as { id: string }).id
            : null;
        if (createdId) {
          await prisma.user.update({
            where: { id: createdId },
            data: { role: userData.role },
          });
          userId = createdId;
          console.log(`✓ User ${userData.email} created with role ${userData.role}`);
        }
      } catch (err) {
        console.error(`✗ Error creating ${userData.email}:`, err);
      }
    }
    if (userId) {
      userIdsByEmail[userData.email] = userId;
    }
  }

  // Get admin ID
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    userIdsByEmail[adminEmail] = adminUser.id;
  }

  // 3. Clear existing issues created by these test accounts to avoid duplicate clutter
  const creatorIds = Object.values(userIdsByEmail);
  
  // Clean up notifications first
  await prisma.notification.deleteMany({
    where: { userId: { in: creatorIds } },
  });
  
  // Clean up comments and histories to resolve constraints
  await prisma.comment.deleteMany({
    where: { userId: { in: creatorIds } },
  });
  await prisma.issueHistory.deleteMany({
    where: { actorId: { in: creatorIds } },
  });

  // Clean up screenshot and attachment entries linked to creator's issues
  const existingIssues = await prisma.issue.findMany({
    where: { createdBy: { in: creatorIds } },
    select: { id: true },
  });
  const existingIssueIds = existingIssues.map((issue) => issue.id);

  await prisma.screenshot.deleteMany({
    where: { issueId: { in: existingIssueIds } },
  });
  await prisma.attachment.deleteMany({
    where: { issueId: { in: existingIssueIds } },
  });
  await prisma.issue.deleteMany({
    where: { createdBy: { in: creatorIds } },
  });

  console.log("\nCleared previous test issues and relationships for a clean run.");

  // 4. Seed issues with different statuses, links, attachments, and screenshots
  const issuesToSeed: Array<{
    title: string;
    description: string;
    creatorEmail: string;
    type: IssueType;
    priority: Priority;
    severity: Severity;
    status: IssueStatus;
    url: string;
    filename: string;
    attachmentUrl: string;
    screenshotUrl: string;
  }> = [
    {
      title: "Network connectivity issues in regional offices",
      description: "Regional office reporting intermittent disconnection from the main server routing table.",
      creatorEmail: "tester1@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "CRITICAL",
      status: "OPEN",
      url: "https://github.com/ethiotelecom/network-issues/1",
      filename: "network_log_diag.txt",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/network/800/600",
    },
    {
      title: "Upgrade billing database indices for performance",
      description: "Billing monthly query timeouts. Require composite indices on user account active states.",
      creatorEmail: "user1@ethiotelecom.test",
      type: "IMPROVEMENT",
      priority: "MEDIUM",
      severity: "MAJOR",
      status: "IN_PROGRESS",
      url: "https://github.com/ethiotelecom/billing/pull/42",
      filename: "migration_indices_plan.pdf",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/billing/800/600",
    },
    {
      title: "Mobile App crash on payment page load",
      description: "App crashes when payment method is clicked under weak 3G connection.",
      creatorEmail: "tester2@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "CRITICAL",
      status: "RESOLVED",
      url: "https://github.com/ethiotelecom/mobile-app/issues/99",
      filename: "crash_stacktrace.log",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/crash/800/600",
    },
    {
      title: "Add dark mode to internal admin console",
      description: "Request from operations team to reduce eye strain during night shifts.",
      creatorEmail: "user2@ethiotelecom.test",
      type: "IMPROVEMENT",
      priority: "LOW",
      severity: "MINOR",
      status: "CLOSED",
      url: "https://figma.com/file/internal-console-designs",
      filename: "dark_mode_mockup.png",
      attachmentUrl: "https://picsum.photos/seed/mockup-design/800/600",
      screenshotUrl: "https://picsum.photos/seed/figma-view/800/600",
    },
    {
      title: "SMS gateway API returns 504 gateway timeout",
      description: "Intermittent timeouts during peak messaging slots on weekends.",
      creatorEmail: "tester3@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "MAJOR",
      status: "OPEN",
      url: "https://status.sms-gateway.test",
      filename: "gateway_report.csv",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/sms/800/600",
    },
    {
      title: "Refactor user authentication session storage",
      description: "Move from nextauth cookies to standalone Hono backend session schema.",
      creatorEmail: "user3@ethiotelecom.test",
      type: "IMPROVEMENT",
      priority: "HIGH",
      severity: "MAJOR",
      status: "RESOLVED",
      url: "https://github.com/ethiotelecom/migration-hono/12",
      filename: "session_diagram.png",
      attachmentUrl: "https://picsum.photos/seed/diagram/800/600",
      screenshotUrl: "https://picsum.photos/seed/hono-routes/800/600",
    },
    {
      title: "Broken profile picture crop aspect ratio",
      description: "Profile picture appears stretched on tablet devices.",
      creatorEmail: "user4@ethiotelecom.test",
      type: "BUG",
      priority: "LOW",
      severity: "MINOR",
      status: "IN_PROGRESS",
      url: "https://github.com/ethiotelecom/profile/issues/3",
      filename: "aspect_ratio_fix.diff",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/avatar/800/600",
    }
  ];

  console.log("\nSeeding issues with attachments, screenshots, and links...\n");

  for (const issueData of issuesToSeed) {
    const creatorId = userIdsByEmail[issueData.creatorEmail];
    if (!creatorId) {
      console.log(`✗ Skipping issue "${issueData.title}" - creator ID not found.`);
      continue;
    }

    // Create the Issue
    const issue = await prisma.issue.create({
      data: {
        title: issueData.title,
        description: issueData.description,
        type: issueData.type,
        priority: issueData.priority,
        severity: issueData.severity,
        status: issueData.status,
        url: issueData.url,
        createdBy: creatorId,
      },
    });

    // Attach File (Attachment model)
    await prisma.attachment.create({
      data: {
        issueId: issue.id,
        uploaderId: creatorId,
        url: issueData.attachmentUrl,
        filename: issueData.filename,
        mimeType: issueData.filename.endsWith(".pdf")
          ? "application/pdf"
          : issueData.filename.endsWith(".png")
            ? "image/png"
            : "text/plain",
        sizeBytes: 20485,
      },
    });

    // Attach Image (Screenshot model)
    await prisma.screenshot.create({
      data: {
        issueId: issue.id,
        url: issueData.screenshotUrl,
        filename: "screenshot_evidence.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1048576,
      },
    });

    console.log(`✓ Seeded issue: "${issue.title}" (Status: ${issue.status}) with attachment & screenshot.`);
  }

  // 5. Seed database-driven CASL authorization rules (Permission table).
  // These mirror the hardcoded fallback in src/lib/casl.ts.
  console.log("\nSeeding CASL permission rules...\n");

  const permissionRules: Array<{
    role: Role;
    action: string;
    subject: string;
    inverted: boolean;
  }> = [
    // Admin can do anything.
    { role: "ADMIN", action: "manage", subject: "all", inverted: false },
  ];

  // USER and TESTER share the same non-admin rule set.
  const nonAdminRoles: Role[] = ["USER", "TESTER"];
  for (const role of nonAdminRoles) {
    permissionRules.push(
      { role, action: "create", subject: "Issue", inverted: false },
      { role, action: "read", subject: "Issue", inverted: false },
      { role, action: "update", subject: "Issue", inverted: false },
      { role, action: "delete", subject: "Issue", inverted: true },
      { role, action: "create", subject: "Comment", inverted: false },
      { role, action: "read", subject: "Comment", inverted: false },
      { role, action: "read", subject: "Notification", inverted: false },
      { role, action: "read", subject: "IssueHistory", inverted: false },
    );
  }

  for (const rule of permissionRules) {
    await prisma.permission.upsert({
      where: {
        role_action_subject: {
          role: rule.role,
          action: rule.action,
          subject: rule.subject,
        },
      },
      update: { inverted: rule.inverted },
      create: rule,
    });
  }
  console.log(`\u2713 Seeded ${permissionRules.length} CASL permission rules.`);

  await prisma.$disconnect();
  console.log("\n=== DATABASE SEEDING COMPLETED ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
