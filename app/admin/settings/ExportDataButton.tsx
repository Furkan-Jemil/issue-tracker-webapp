"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExportDataButton({
  compact = false,
}: {
  compact?: boolean;
}) {
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
        size={compact ? "icon" : "default"}
        disabled={pending}
        aria-label="Download JSON export"
        title="Download JSON export"
        onClick={handleExport}>
        {compact ? (
          <Download className="h-4 w-4" aria-hidden="true" />
        ) : pending ? (
          "Exporting…"
        ) : (
          "Download JSON export"
        )}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
