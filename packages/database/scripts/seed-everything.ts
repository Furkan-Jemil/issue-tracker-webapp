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
      title: "CASL authorization bypass: closed-state issues remain editable via direct API PUT",
      description: "Steps to reproduce:\n1. Submit a defect report and advance its finite-state lifecycle to CLOSED.\n2. As a standard user (author), the UI correctly disables the edit button.\n3. Send a direct PATCH request to /api/issues/:id with an updated description payload.\n\nExpected behavior:\nThe NestJS PoliciesGuard / CASL ability factory should evaluate the status condition and reject the request with HTTP 403 Forbidden.\n\nActual behavior:\nThe handler accepts the payload and updates the database record, bypassing the closed-state immutability rule.",
      creatorEmail: "furkanjemil54@gmail.com",
      type: "BUG" as IssueType,
      priority: "HIGH" as Priority,
      severity: "CRITICAL" as Severity,
      status: "OPEN" as IssueStatus,
      url: "https://www.authgear.com/post/http-403-forbidden",
      filename: "casl-bypass-repro.pdf",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/casl-403/800/600",
    },
    {
      title: "Memory leak in screenshot blob preview during repeated file attach cycles",
      description: "When a user repeatedly attaches and removes screenshot files from the evidence uploader without submitting the form, object URLs created by URL.createObjectURL() are never revoked on unmount.\n\nReproduction:\n1. Open the Create Issue drawer.\n2. Attach 3 screenshots, then remove them all.\n3. Repeat 10+ cycles without submitting.\n4. Observe: heap snapshot in DevTools shows growing Blob count, never GC'd.\n\nImpact:\nOn long QA sessions with many cycles, the tab memory climbs to 2–4 GB before the browser terminates the renderer process.",
      creatorEmail: "tester1@ethiotelecom.test",
      type: "BUG" as IssueType,
      priority: "MEDIUM" as Priority,
      severity: "MAJOR" as Severity,
      status: "IN_PROGRESS" as IssueStatus,
      url: "https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static",
      filename: "heap-snapshot-cycle-10.json",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/memory-leak/800/600",
    },
    {
      title: "Add cursor-based pagination to mobile issue listing endpoint",
      description: "The current GET /api/issues-mobile endpoint returns all issues in a single payload, sorted by createdAt DESC. On accounts with 500+ issues this exceeds the 1 MB Vercel Edge response limit and causes gateway timeouts on slow mobile connections.\n\nProposed solution:\n- Replace offset pagination (skip/take) with keyset/cursor pagination using the issue id as the cursor.\n- Response shape: { data: Issue[], nextCursor: string | null }\n- Clients pass ?cursor=<id>&limit=25 on subsequent requests.\n- Ensures stable ordering under concurrent inserts without re-fetching duplicates.",
      creatorEmail: "user3@ethiotelecom.test",
      type: "IMPROVEMENT" as IssueType,
      priority: "HIGH" as Priority,
      severity: "MAJOR" as Severity,
      status: "RESOLVED" as IssueStatus,
      url: "https://www.prisma.io/docs/orm/prisma-client/queries/pagination",
      filename: "cursor-pagination-rfc.pdf",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/pagination/800/600",
    },
    {
      title: "Database connection pool exhaustion under concurrent QA load testing",
      description: "During the weekly load test (50 concurrent Tester sessions, k6 script), the Prisma connection pool is exhausted within 90 seconds, producing:\n\nP2024: Timed out fetching a new connection from the connection pool.\n\nRoot cause analysis:\n- Pool size defaults to 10 (DATABASE_URL connection_limit not set).\n- Each Server Action opens a transaction that holds a connection for the full request lifecycle.\n- Under 50-user concurrency, all 10 slots are claimed and new requests queue indefinitely.\n\nFix required:\n1. Set connection_limit=25&pool_timeout=30 in DATABASE_URL.\n2. Audit all server actions to ensure transactions are as short as possible.\n3. Add PgBouncer in front of Neon in the production environment.",
      creatorEmail: "furkanjemil54@gmail.com",
      type: "BUG" as IssueType,
      priority: "HIGH" as Priority,
      severity: "CRITICAL" as Severity,
      status: "IN_PROGRESS" as IssueStatus,
      url: "https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool",
      filename: "k6-load-test-results.csv",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/pgpool/800/600",
    },
    {
      title: "Update BetterAuth session cookie maxAge to 7 days",
      description: "The current BetterAuth configuration sets the session cookie maxAge to the library default (1 day). QA testers and admins are forced to re-authenticate daily, which creates friction during sprint review weeks.\n\nChange required in apps/web/src/lib/auth.ts:\n  expiresIn: 60 * 60 * 24 * 7,  // 7 days\n\nSecurity considerations:\n- Tokens are JWT-signed with HS256 — increasing maxAge only extends the cookie lifetime, not the server-side revocation window.\n- Session invalidation on logout already calls auth.api.signOut() which deletes the DB session row.\n- No additional risk for a 1-day → 7-day change given the existing logout flow.",
      creatorEmail: "user1@ethiotelecom.test",
      type: "IMPROVEMENT" as IssueType,
      priority: "LOW" as Priority,
      severity: "MINOR" as Severity,
      status: "CLOSED" as IssueStatus,
      url: "https://www.better-auth.com/docs/concepts/session-management",
      filename: "auth-config-patch.diff",
      attachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      screenshotUrl: "https://picsum.photos/seed/betterauth/800/600",
    },
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
