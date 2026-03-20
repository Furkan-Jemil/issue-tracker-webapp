import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export default async function FilteredIssuesPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to filter issues.</div>;
  }
  const status = searchParams.status || "";
  const priority = searchParams.priority || "";
  const severity = searchParams.severity || "";
  const where: any = { createdBy: session.user.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (severity) where.severity = severity;
  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Filter Issues</h1>
      <form method="get" className="mb-6 flex gap-2 flex-wrap">
        <select
          name="status"
          defaultValue={status}
          className="border rounded px-2 py-1">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          name="priority"
          defaultValue={priority}
          className="border rounded px-2 py-1">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select
          name="severity"
          defaultValue={severity}
          className="border rounded px-2 py-1">
          <option value="">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Filter
        </button>
      </form>
      <ul>
        {issues.map((issue) => (
          <li key={issue.id} className="mb-2 p-3 border rounded">
            <div className="font-semibold">{issue.title}</div>
            <div className="text-sm text-gray-500">
              {issue.status} | {new Date(issue.createdAt).toLocaleString()}
            </div>
            <div className="text-sm">{issue.description.slice(0, 100)}...</div>
          </li>
        ))}
        {issues.length === 0 && <li>No issues found.</li>}
      </ul>
    </div>
  );
}
