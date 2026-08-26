"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Eye, Loader2, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocumentVersionView } from "@/features/documents/document.types";
import { getDemoUser } from "@/features/session/demo-users";

type VersionPreviewDialogProps = {
  isRestoring: boolean;
  onClose: () => void;
  onRestore: () => void;
  version: DocumentVersionView;
};

function formatPreviewDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

// A separate read-only editor gives users a faithful formatted preview while
// keeping the live editor untouched until they explicitly choose Restore.
export function VersionPreviewDialog({
  isRestoring,
  onClose,
  onRestore,
  version,
}: VersionPreviewDialogProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: version.content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-56 px-5 py-4 text-sm leading-7 outline-none",
        "aria-label": "Saved version preview",
      },
    },
  });
  const author = getDemoUser(version.createdById);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <section
        aria-describedby="version-preview-description"
        aria-labelledby="version-preview-title"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold" id="version-preview-title">
              <Eye aria-hidden="true" className="size-5" />
              Version preview
            </h2>
            <p className="mt-1 truncate text-sm font-medium">{version.title}</p>
            <p className="text-xs text-muted-foreground" id="version-preview-description">
              Saved {formatPreviewDate(version.createdAt)} by {author?.name ?? "Demo user"}
            </p>
          </div>
          <Button
            aria-label="Close version preview"
            disabled={isRestoring}
            onClick={onClose}
            size="icon-sm"
            title="Close version preview"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-background/60">
          {editor ? <EditorContent editor={editor} /> : null}
        </div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-border px-5 py-4">
          <Button disabled={isRestoring} onClick={onClose} type="button" variant="outline">
            Close preview
          </Button>
          <Button disabled={isRestoring} onClick={onRestore} type="button">
            {isRestoring ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <RotateCcw aria-hidden="true" />
            )}
            {isRestoring ? "Restoring…" : "Restore this version"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
