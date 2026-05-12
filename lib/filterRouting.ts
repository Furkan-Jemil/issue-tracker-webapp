export type IssueFilterState = {
  view?: string;
  q?: string;
  createdFrom?: string;
  createdTo?: string;
  status?: string;
  priority?: string;
  severity?: string;
  reporter?: string;
  assignee?: string;
};

export function buildIssueFilterSearchParams(filters: IssueFilterState) {
  const nextParams = new URLSearchParams();

  if (filters.view) nextParams.set("view", filters.view);
  nextParams.set("page", "1");
  if (filters.q) nextParams.set("q", filters.q);
  if (filters.createdFrom) nextParams.set("createdFrom", filters.createdFrom);
  if (filters.createdTo) nextParams.set("createdTo", filters.createdTo);
  if (filters.status) nextParams.set("status", filters.status);
  if (filters.priority) nextParams.set("priority", filters.priority);
  if (filters.severity) nextParams.set("severity", filters.severity);
  if (filters.reporter) nextParams.set("reporter", filters.reporter);
  if (filters.assignee) nextParams.set("assignee", filters.assignee);

  return nextParams;
}

export function buildIssueListHref(basePath: string, filters: IssueFilterState) {
  const query = buildIssueFilterSearchParams(filters).toString();
  return `${basePath}?${query}`;
}

export function clearIssueFiltersHref(basePath: string, view: string) {
  const params = new URLSearchParams({ view, page: "1" });
  return `${basePath}?${params.toString()}`;
}