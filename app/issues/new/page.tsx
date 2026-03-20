import { Button } from "@/components/ui/button";
import { IssueType, PrismaClient, Priority, Severity } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { defineAbilitiesFor } from "@/lib/casl";
import { ScreenshotUpload } from "@/components/issue/ScreenshotUpload";
import React, { useState } from "react";

const prisma = new PrismaClient();

async function uploadScreenshots(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("screenshots", file));
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return data.files;
}

async function createIssue(formData: FormData) {
  "use server";
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  const ability = defineAbilitiesFor(session.user);
  if (!ability.can("create", "Issue")) {
    throw new Error("Not authorized");
  }
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;
  const severity = formData.get("severity") as string;
  const url = formData.get("url") as string;
  // Screenshots will be uploaded via client-side fetch
  const screenshotsMeta = formData.get("screenshotsMeta");
  let screenshots = [];
  if (screenshotsMeta) {
    screenshots = JSON.parse(screenshotsMeta as string);
  }

  if (!title || !description || !type || !priority || !severity) {
    redirect("/issues/new?error=missing-required-fields");
  }

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      type: type as IssueType,
      priority: priority as Priority,
      severity: severity as Severity,
      url,
      createdBy: session.user.id,
      screenshots: {
        create: screenshots.map((file: any, idx: number) => ({
          url: file.url,
          filename: file.filename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          order: idx,
        })),
      },
    },
    include: { screenshots: true },
  });
  redirect("/issues");
}

export default function NewIssuePage() {
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [screenshotsMeta, setScreenshotsMeta] = useState<any[]>([]);

  async function handleScreenshotChange(files: File[], previews: string[]) {
    setScreenshots(files);
    setPreviews(previews);
    if (files.length > 0) {
      const uploaded = await uploadScreenshots(files);
      setScreenshotsMeta(uploaded);
    } else {
      setScreenshotsMeta([]);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={createIssue}
        method="post"
        className="space-y-4 bg-white p-8 rounded shadow w-full max-w-lg"
        encType="multipart/form-data">
        <h1 className="text-2xl font-bold mb-4">Report New Issue</h1>
        <input
          name="title"
          type="text"
          placeholder="Title"
          required
          className="w-full border p-2 rounded"
          maxLength={255}
        />
        <textarea
          name="description"
          placeholder="Description"
          required
          className="w-full border p-2 rounded"
        />
        <select name="type" required className="w-full border p-2 rounded">
          <option value="BUG">Bug</option>
          <option value="IMPROVEMENT">Improvement</option>
        </select>
        <select name="priority" required className="w-full border p-2 rounded">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select name="severity" required className="w-full border p-2 rounded">
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <input
          name="url"
          type="url"
          placeholder="URL (optional)"
          className="w-full border p-2 rounded"
        />
        <input
          type="hidden"
          name="screenshotsMeta"
          value={JSON.stringify(screenshotsMeta)}
        />
        <ScreenshotUpload onChange={handleScreenshotChange} />
        <Button type="submit" className="w-full">
          Submit Issue
        </Button>
      </form>
    </div>
  );
}
