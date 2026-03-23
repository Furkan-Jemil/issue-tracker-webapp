import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { getAppSession } from "@/lib/auth/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getAppSession();
  if (!session?.user) {
    return <div className="p-8">You must be logged in to search issues.</div>;
  }

  const isAdmin = session.user.role === "ADMIN";
  const q = searchParams.q || "";
  let issues: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    creator: { name: string; email: string };
  }> = [];

  if (q.trim()) {
    issues = await prisma.issue.findMany({
      where: {
        ...(isAdmin ? {} : { createdBy: session.user.id }),
        title: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 md:px-6 md:py-8">
      <h1 className="mb-4 text-2xl font-bold">
        {isAdmin ? "Admin Issue Search" : "Search My Issues"}
      </h1>
      <form method="get" className="mb-6 flex gap-2">
        <label htmlFor="search-query" className="sr-only">
          Search query
        </label>
        <Input
          id="search-query"
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title..."
        />
        <Button type="submit">Search</Button>
      </form>
      {q && (
        <div className="mb-3 text-sm text-muted-foreground">
          Results for: <span className="font-semibold">{q}</span>
        </div>
      )}
      <ul aria-live="polite" className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="text-primary hover:underline">
                    {issue.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0 text-sm">
                <div className="text-muted-foreground">
                  {issue.status} | {new Date(issue.createdAt).toLocaleString()}
                </div>
                {isAdmin && (
                  <div className="text-muted-foreground">
                    Reporter: {issue.creator.name || issue.creator.email}
                  </div>
                )}
                <div>{issue.description.slice(0, 100)}...</div>
              </CardContent>
            </Card>
          </li>
        ))}
        {q && issues.length === 0 && <li>No issues found.</li>}
      </ul>
    </div>
  );
}
