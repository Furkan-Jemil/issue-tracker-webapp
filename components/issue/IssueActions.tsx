"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteIssue, updateIssue } from "@/app/issues/[id]/actions";

type IssueInitial = {
  title: string;
  description: string;
  type: string;
  priority: string;
  severity: string;
  url: string | null;
  sourceNotes: string | null;
  reportedAt: string;
  assigneeId: string | null;
  status: string;
};

type AssigneeOption = {
  id: string;
  label: string;
};

export function IssueActions({
  issueId,
  initial,
  canEdit,
  canDelete,
  isAdmin,
  assigneeOptions,
}: {
  issueId: string;
  initial: IssueInitial;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  assigneeOptions: AssigneeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!canEdit) return;

    function openWhenHashMatches() {
      if (window.location.hash === "#edit-section") {
        setOpen(true);
      }
    }

    openWhenHashMatches();
    window.addEventListener("hashchange", openWhenHashMatches);
    return () => window.removeEventListener("hashchange", openWhenHashMatches);
  }, [canEdit]);

  return (
    <section id="edit-section" className="space-y-4" aria-label="Issue actions">
      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Issue actions
          </p>
          {canEdit ? (
            <Button
              type="button"
              variant={open ? "secondary" : "outline"}
              onClick={() => setOpen((v) => !v)}>
              {open ? "Close editor" : "Update issue"}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              className="sm:ml-auto"
              onClick={() => {
                if (
                  !confirm(
                    "Delete this issue and all related data? This cannot be undone.",
                  )
                ) {
                  return;
                }
                startTransition(() => {
                  deleteIssue(issueId);
                });
              }}>
              Delete issue
            </Button>
          ) : null}
        </div>
      </div>

      {canEdit && open ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="text-lg">Update issue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Refine issue details, update workflow fields, then save changes.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={(fd) => {
                startTransition(() => {
                  updateIssue(issueId, fd);
                });
              }}>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      required
                      maxLength={255}
                      defaultValue={initial.title}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      required
                      rows={9}
                      defaultValue={initial.description}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-3 md:p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Workflow and metadata
                  </p>
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-type">Type</Label>
                      <Select
                        id="edit-type"
                        name="type"
                        required
                        defaultValue={initial.type}>
                        <option value="BUG">Bug</option>
                        <option value="IMPROVEMENT">Improvement</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select
                        id="edit-priority"
                        name="priority"
                        required
                        defaultValue={initial.priority}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-severity">Severity</Label>
                      <Select
                        id="edit-severity"
                        name="severity"
                        required
                        defaultValue={initial.severity}>
                        <option value="MINOR">Minor</option>
                        <option value="MAJOR">Major</option>
                        <option value="CRITICAL">Critical</option>
                      </Select>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        id="edit-status"
                        name="status"
                        required
                        defaultValue={initial.status}>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </Select>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-url">URL (optional)</Label>
                    <Input
                      id="edit-url"
                      name="url"
                      type="url"
                      placeholder="https://..."
                      defaultValue={initial.url ?? ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-sourceNotes">
                      Source notes (optional)
                    </Label>
                    <Input
                      id="edit-sourceNotes"
                      name="sourceNotes"
                      placeholder="Add extra context for reviewers"
                      defaultValue={initial.sourceNotes ?? ""}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-reportedAt">Date reported</Label>
                      <Input
                        id="edit-reportedAt"
                        name="reportedAt"
                        type="date"
                        defaultValue={initial.reportedAt}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-assigneeId">Assigned to</Label>
                      <Select
                        id="edit-assigneeId"
                        name="assigneeId"
                        defaultValue={initial.assigneeId ?? ""}
                        disabled={!isAdmin}>
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <p className="text-xs text-muted-foreground sm:ml-auto">
                  Saved updates appear immediately on this page.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
