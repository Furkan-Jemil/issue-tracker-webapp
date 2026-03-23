import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  function eventVariant(eventType: string) {
    if (eventType === "CREATED") return "secondary" as const;
    if (eventType === "STATUS_CHANGED") return "warning" as const;
    if (eventType === "COMMENTED") return "success" as const;
    return "outline" as const;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 md:px-6 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <caption className="sr-only">Recent issue history events</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Time</TableHead>
                <TableHead scope="col">User</TableHead>
                <TableHead scope="col">Event</TableHead>
                <TableHead scope="col">Description</TableHead>
                <TableHead scope="col">Issue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.actor?.name} ({log.actor?.email})
                  </TableCell>
                  <TableCell>
                    <Badge variant={eventVariant(log.eventType)}>
                      {log.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>{log.issue?.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
