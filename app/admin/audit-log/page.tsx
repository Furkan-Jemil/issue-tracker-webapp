import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";



export default async function AdminAuditLogPage() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8">Admin access required.</div>;
  }
  const logs = await prisma.issueHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { name: true, email: true } },
      issue: { select: { title: true } },
    },
  });
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <table className="w-full border">
        <caption className="sr-only">Recent issue history events</caption>
        <thead>
          <tr className="bg-gray-100">
            <th scope="col" className="p-2">Time</th>
            <th scope="col" className="p-2">User</th>
            <th scope="col" className="p-2">Event</th>
            <th scope="col" className="p-2">Description</th>
            <th scope="col" className="p-2">Issue</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">
                {new Date(log.createdAt).toLocaleString()}
              </td>
              <td className="p-2">
                {log.actor?.name} ({log.actor?.email})
              </td>
              <td className="p-2">{log.eventType}</td>
              <td className="p-2">{log.description}</td>
              <td className="p-2">{log.issue?.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
