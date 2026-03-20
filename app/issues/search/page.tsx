import { PrismaClient } from "@prisma/client";
import type { Issue } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to search issues.</div>;
  }
  const q = searchParams.q || "";
  let issues: Issue[] = [];
  if (q.trim()) {
    issues = await prisma.issue.findMany({
      where: {
        createdBy: session.user.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Search Issues</h1>
      <form method="get" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title or description..."
          className="border rounded px-3 py-2 w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Search
        </button>
      </form>
      {q && (
        <div className="mb-2 text-gray-600">
          Results for: <span className="font-semibold">{q}</span>
        </div>
      )}
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
        {q && issues.length === 0 && <li>No issues found.</li>}
      </ul>
    </div>
  );
}
