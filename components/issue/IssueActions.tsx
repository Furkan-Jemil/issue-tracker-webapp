"use client";

import { useState, useTransition } from "react";
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

  return (
    <section className="mt-6 space-y-4" aria-label="Issue actions">
      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Button
            type="button"
            variant={open ? "secondary" : "outline"}
            onClick={() => setOpen((v) => !v)}>
            {open ? "Close editor" : "Edit issue"}
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
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

      {canEdit && open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={(fd) => {
                startTransition(() => {
                  updateIssue(issueId, fd);
                });
              }}>
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
                  rows={6}
                  defaultValue={initial.description}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select id="edit-type" name="type" required defaultValue={initial.type}>
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
                <Label htmlFor="edit-sourceNotes">Source notes (optional)</Label>
                <Input
                  id="edit-sourceNotes"
                  name="sourceNotes"
                  placeholder="Where was the issue logged"
                  defaultValue={initial.sourceNotes ?? ""}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
