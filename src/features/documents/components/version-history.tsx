"use client";

import { useEffect, useState } from "react";
import { Eye, History, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  DocumentVersionView,
  DocumentView,
} from "@/features/documents/document.types";
import { VersionPreviewDialog } from "@/features/documents/components/version-preview-dialog";
import { getDemoUser } from "@/features/session/demo-users";

type VersionHistoryProps = {
  canRestore: boolean;
  document: DocumentView;
  onClose: () => void;
  onRestored: (document: DocumentView) => void;
};

function formatVersionDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

// This panel keeps history read/restore behavior together while the parent
// editor remains responsible for applying the restored content to Tiptap.
export function VersionHistory({
  canRestore,
  document,
  onClose,
  onRestored,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersionView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(
    null,
  );
  const [previewVersion, setPreviewVersion] =
    useState<DocumentVersionView | null>(null);

  useEffect(() => {
    let isActive = true;

    fetch(`/api/documents/${document.id}/versions`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          versions?: DocumentVersionView[];
          error?: string;
        };

        if (!response.ok || !result.versions) {
          throw new Error(result.error ?? "Unable to load version history");
        }

        if (isActive) {
          setVersions(result.versions);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load version history",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [document.id]);

  async function restoreVersion(versionId: string) {
    if (restoringVersionId) {
      return;
    }

    setRestoringVersionId(versionId);

    try {
      const response = await fetch(
        `/api/documents/${document.id}/versions/${versionId}/restore`,
        { method: "POST" },
      );
      const result = (await response.json()) as {
        document?: DocumentView;
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to restore version");
      }

      onRestored(result.document);
      toast.success("Version restored");
      setPreviewVersion(null);
      onClose();
    } catch (restoreError: unknown) {
      toast.error(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore version",
      );
    } finally {
      setRestoringVersionId(null);
    }
  }

  return (
    <>
      <button
        aria-label="Close version history"
        className="absolute inset-0 z-10 bg-foreground/20 md:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm shrink-0 flex-col border-l border-border bg-card shadow-xl md:relative md:z-0 md:shadow-none">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <History aria-hidden="true" className="size-4" />
              Version history
            </h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading saved versions…" : `${versions.length} recent versions`}
            </p>
          </div>
          <Button
            aria-label="Close version history"
            onClick={onClose}
            size="icon-sm"
            title="Close version history"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Loading history…
            </div>
          ) : error ? (
            <p className="px-2 py-3 text-sm leading-6 text-destructive">{error}</p>
          ) : versions.length === 0 ? (
            <p className="px-2 py-3 text-sm leading-6 text-muted-foreground">
              Saved versions will appear here after you make changes.
            </p>
          ) : (
            <ol className="space-y-2">
              {versions.map((version) => {
                const author = getDemoUser(version.createdById);
                const isRestoring = restoringVersionId === version.id;

                return (
                  <li
                    className="rounded-lg border border-border p-3"
                    key={version.id}
                  >
                    <p className="truncate text-sm font-medium">{version.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatVersionDate(version.createdAt)} · {author?.name ?? "Demo user"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={Boolean(restoringVersionId)}
                        onClick={() => setPreviewVersion(version)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Eye aria-hidden="true" />
                        Preview
                      </Button>
                      {canRestore ? (
                        <Button
                          className="flex-1"
                          disabled={Boolean(restoringVersionId)}
                          onClick={() => void restoreVersion(version.id)}
                          size="sm"
                          type="button"
                        >
                          {isRestoring ? (
                            <Loader2 aria-hidden="true" className="animate-spin" />
                          ) : (
                            <RotateCcw aria-hidden="true" />
                          )}
                          {isRestoring ? "Restoring…" : "Restore"}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </aside>
      {previewVersion ? (
        <VersionPreviewDialog
          isRestoring={restoringVersionId === previewVersion.id}
          onClose={() => setPreviewVersion(null)}
          onRestore={() => void restoreVersion(previewVersion.id)}
          version={previewVersion}
        />
      ) : null}
    </>
  );
}
