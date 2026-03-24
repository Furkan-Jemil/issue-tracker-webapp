import {
  parseIssueStatus,
  parsePriority,
  parseSeverity,
} from "@/lib/issueFilters";
import { redirect } from "next/navigation";

export default async function FilteredIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    severity?: string;
    reporter?: string;
    density?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  const query = params?.q?.trim() || "";
  if (query) {
    nextParams.set("q", query);
  }

  const status = parseIssueStatus(params?.status);
  if (status) {
    nextParams.set("status", status);
  }

  const priority = parsePriority(params?.priority);
  if (priority) {
    nextParams.set("priority", priority);
  }

  const severity = parseSeverity(params?.severity);
  if (severity) {
    nextParams.set("severity", severity);
  }

  const reporter = params?.reporter?.trim() || "";
  if (reporter) {
    nextParams.set("reporter", reporter);
  }

  if (params?.density === "compact" || params?.density === "comfortable") {
    nextParams.set("density", params.density);
  }

  if (params?.page && /^\d+$/.test(params.page) && Number(params.page) > 0) {
    nextParams.set("page", params.page);
  }

  redirect(
    nextParams.size > 0 ? `/issues?${nextParams.toString()}` : "/issues",
  );
}
