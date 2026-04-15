"use client";

import { useMemo, useState } from "react";
import { ImageIcon, LayoutGrid, Palette, Ruler, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const IMAGE_PATHS = [
  "/ui-references/linear-board-01.jpg",
  "/ui-references/linear-board-02.jpg",
  "/ui-references/linear-board-03.jpg",
  "/ui-references/linear-board-04.jpg",
  "/ui-references/linear-board-05.jpg",
  "/ui-references/linear-board-06.jpg",
];

const qualitySignals = [
  {
    label: "Icon clarity",
    note: "Outline icons with consistent optical weight and strong contrast.",
    icon: Sparkles,
  },
  {
    label: "Spacing rhythm",
    note: "Tight grouping inside cards and wider breathing room between sections.",
    icon: Ruler,
  },
  {
    label: "Layout balance",
    note: "Kanban density stays readable by using repeated card widths and gutters.",
    icon: LayoutGrid,
  },
  {
    label: "Color strategy",
    note: "Neutral base plus selective status colors for quick scanning.",
    icon: Palette,
  },
];

export function DesignReferenceGallery({ className }: { className?: string }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const visibleImages = useMemo(
    () => IMAGE_PATHS.filter((path) => !hidden[path]),
    [hidden],
  );

  return (
    <section className={cn("space-y-3", className)} aria-label="Design references">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            Image-Based UI Reference Panel
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Place your reference images in public/ui-references using the filenames linear-board-01..06.jpg.
            This panel uses them directly inside the app to keep implementation aligned with your visual direction.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visibleImages.map((src, index) => (
              <div
                key={src}
                className="group overflow-hidden rounded-xl border border-border/75 bg-background/65">
                <img
                  src={src}
                  alt={`Design reference ${index + 1}`}
                  className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  onError={() => setHidden((prev) => ({ ...prev, [src]: true }))}
                />
              </div>
            ))}
          </div>

          {visibleImages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
              No local reference images found yet. Add your files to public/ui-references and reload.
            </div>
          ) : null}

          <div className="grid gap-2 md:grid-cols-2">
            {qualitySignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="rounded-xl border border-border/75 bg-card/80 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {signal.label}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{signal.note}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
