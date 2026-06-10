import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIssueFilterSearchParams,
  buildIssueListHref,
  clearIssueFiltersHref,
} from "../src/lib/filterRouting";
import { getPaginationMeta, getTotalPages } from "../src/lib/pagination";

test("buildIssueFilterSearchParams preserves active filters and resets page to 1", () => {
  const params = buildIssueFilterSearchParams({
    view: "details",
    q: "printer",
    status: "OPEN",
    priority: "HIGH",
  });

  assert.equal(params.get("view"), "details");
  assert.equal(params.get("page"), "1");
  assert.equal(params.get("q"), "printer");
  assert.equal(params.get("status"), "OPEN");
  assert.equal(params.get("priority"), "HIGH");
  assert.equal(params.get("severity"), null);
});

test("clearIssueFiltersHref resets to the requested view on page 1", () => {
  assert.equal(clearIssueFiltersHref("/issues", "board"), "/issues?view=board&page=1");
});

test("buildIssueListHref includes filter state in a stable URL", () => {
  assert.equal(
    buildIssueListHref("/issues", { view: "compact", assignee: "user-1", createdFrom: "2026-05-01" }),
    "/issues?view=compact&page=1&createdFrom=2026-05-01&assignee=user-1",
  );
});

test("pagination helpers clamp page counts and control visibility", () => {
  assert.equal(getTotalPages(0, 15), 1);
  assert.equal(getTotalPages(31, 15), 3);

  const meta = getPaginationMeta(31, 15, 99);
  assert.equal(meta.totalPages, 3);
  assert.equal(meta.currentPage, 3);
  assert.equal(meta.hasPrev, true);
  assert.equal(meta.hasNext, false);
  assert.equal(meta.shouldShowControls, true);
});