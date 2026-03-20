import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentThread } from "@/components/issue/CommentThread";

const prisma = new PrismaClient();

export default async function IssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to view this issue.</div>;
  }
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      screenshots: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
      history: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!issue || issue.createdBy !== session.user.id) {
    notFound();
  }
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">{issue.title}</h1>
      <div className="mb-4 text-gray-600">
        Status: <span className="font-semibold">{issue.status}</span>
      </div>
      <div className="mb-4">{issue.description}</div>
      <div className="mb-2">Type: {issue.type}</div>
      <div className="mb-2">Priority: {issue.priority}</div>
      <div className="mb-2">Severity: {issue.severity}</div>
      {issue.url && (
        <div className="mb-2">
          URL:{" "}
          <a href={issue.url} className="text-blue-600 hover:underline">
            {issue.url}
          </a>
        </div>
      )}
      <div className="text-sm text-gray-500">
        Created: {new Date(issue.createdAt).toLocaleString()}
      </div>
      {/* Screenshot gallery */}
      {issue.screenshots.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Screenshots</h2>
          <div className="flex flex-wrap gap-2">
            {issue.screenshots.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer">
                <img
                  src={s.url}
                  alt={s.filename}
                  className="w-24 h-24 object-cover border rounded"
                />
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Comment thread */}
      <div className="mt-8">
        <CommentThread issueId={issue.id} comments={issue.comments} />
      </div>
      {/* Issue history */}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Activity Log</h2>
        <ul className="text-sm text-gray-700">
          {issue.history.map((h) => (
            <li key={h.id} className="mb-1">
              [{new Date(h.createdAt).toLocaleString()}] {h.eventType}:{" "}
              {h.description} by {h.actor?.name || "Unknown"}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        <Link href="/issues" className="text-blue-600 hover:underline">
          Back to Issues
        </Link>
      </div>
    </div>
  );
}
