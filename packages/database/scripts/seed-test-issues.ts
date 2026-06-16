/**
 * Seed test issues for all users
 */
import "dotenv/config";
import type { IssueType, Priority, Severity, IssueStatus } from "@prisma/client";
import { applyDatabaseUrlNormalization } from "../database-url";

async function main() {
  applyDatabaseUrlNormalization();

  const { default: prisma } = await import("../index");

  const issues: Array<{
    title: string;
    description: string;
    creatorEmail: string;
    type: IssueType;
    priority: Priority;
    severity: Severity;
    status: IssueStatus;
  }> = [
    {
      title: "Login page not responsive on mobile",
      description: "The login form breaks on small screens and is hard to use on mobile devices",
      creatorEmail: "tester1@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "MAJOR",
      status: "OPEN",
    },
    {
      title: "Dashboard charts not loading",
      description: "The dashboard statistics charts fail to load and show a blank area",
      creatorEmail: "tester2@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "CRITICAL",
      status: "OPEN",
    },
    {
      title: "Issue filter by status is broken",
      description: "Filtering issues by status dropdown does not work correctly",
      creatorEmail: "tester3@ethiotelecom.test",
      type: "BUG",
      priority: "MEDIUM",
      severity: "MAJOR",
      status: "OPEN",
    },
    {
      title: "User profile image upload fails",
      description: "When uploading a profile picture, the system returns a 500 error",
      creatorEmail: "tester3@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "CRITICAL",
      status: "IN_PROGRESS",
    },
    {
      title: "Notifications not sending emails",
      description: "Email notifications are not being delivered when issues are assigned",
      creatorEmail: "user1@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "CRITICAL",
      status: "OPEN",
    },
    {
      title: "Comments pagination missing",
      description: "Long comment threads don't have pagination, making the page slow",
      creatorEmail: "user2@ethiotelecom.test",
      type: "IMPROVEMENT",
      priority: "MEDIUM",
      severity: "MAJOR",
      status: "OPEN",
    },
    {
      title: "Export data function timeout",
      description: "Exporting large datasets causes the request to timeout after 30 seconds",
      creatorEmail: "user3@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "MAJOR",
      status: "IN_PROGRESS",
    },
    {
      title: "Admin audit log search is slow",
      description: "Searching through audit logs with large datasets is very slow",
      creatorEmail: "tester1@ethiotelecom.test",
      type: "IMPROVEMENT",
      priority: "MEDIUM",
      severity: "MINOR",
      status: "RESOLVED",
    },
    {
      title: "Dark mode toggle not persistent",
      description: "Dark mode setting resets when the user refreshes the page",
      creatorEmail: "tester2@ethiotelecom.test",
      type: "BUG",
      priority: "LOW",
      severity: "MINOR",
      status: "OPEN",
    },
    {
      title: "File attachments failing to download",
      description: "Users report that attached files to issues fail to download with a 404 or 500",
      creatorEmail: "user4@ethiotelecom.test",
      type: "BUG",
      priority: "MEDIUM",
      severity: "MAJOR",
      status: "OPEN",
    },
    {
      title: "Search returns stale results",
      description: "Issue search index seems out-of-date and returns stale results after updates",
      creatorEmail: "admin@ethiotelecom.test",
      type: "BUG",
      priority: "HIGH",
      severity: "MAJOR",
      status: "OPEN",
    },
  ];

  console.log("Creating test issues...\n");

  for (const issueData of issues) {
    try {
      const creator = await prisma.user.findUnique({
        where: { email: issueData.creatorEmail },
      });

      if (!creator) {
        console.log(`✗ Creator not found: ${issueData.creatorEmail}`);
        continue;
      }

      const issue = await prisma.issue.create({
        data: {
          title: issueData.title,
          description: issueData.description,
          type: issueData.type,
          priority: issueData.priority,
          severity: issueData.severity,
          status: issueData.status,
          createdBy: creator.id,
        },
      });

      console.log(
        `✓ "${issueData.title}" (${issueData.priority}/${issueData.severity}) - Created by ${issueData.creatorEmail}`
      );
    } catch (err) {
      console.error(`✗ Error creating issue:`, err);
    }
  }

  await prisma.$disconnect();

  console.log("\n=== TEST ISSUES CREATED ===\n");
  console.log("11 issues created across all users");
  console.log("- 9 BUG issues");
  console.log("- 2 IMPROVEMENT issues");
  console.log("- 3 CRITICAL severity");
  console.log("- 6 MAJOR severity");
  console.log("- 2 MINOR severity");
  console.log("\nLog in at http://localhost:3003 to see all issues!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
