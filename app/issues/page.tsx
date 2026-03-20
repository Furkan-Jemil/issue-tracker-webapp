import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function IssuesListPage() {
  const session = await getServerSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to view issues.</div>;
  }
  const issues = await prisma.issue.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Issues</h1>
        <Link
          href="/issues/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Report Issue
        </Link>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Title</th>
            <th className="p-2">Type</th>
            <th className="p-2">Priority</th>
            <th className="p-2">Severity</th>
            <th className="p-2">Status</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-t">
              <td className="p-2">
                <Link
                  href={`/issues/${issue.id}`}
                  className="text-blue-600 hover:underline">
                  {issue.title}
                </Link>
              </td>
              <td className="p-2">{issue.type}</td>
              <td className="p-2">{issue.priority}</td>
              <td className="p-2">{issue.severity}</td>
              <td className="p-2">{issue.status}</td>
              <td className="p-2">
                {new Date(issue.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
