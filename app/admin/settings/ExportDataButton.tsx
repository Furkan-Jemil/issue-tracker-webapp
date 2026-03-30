"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ExportDataButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/admin/export", { method: "GET" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Export failed",
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "issue-tracker-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleExport}>
        {pending ? "Exporting…" : "Download JSON export"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
