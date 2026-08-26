"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DocumentView } from "@/features/documents/document.types";

type DeleteDocumentDialogProps = {
  document: DocumentView;
  onClose: () => void;
  onDeleted: (documentId: string) => void;
};

// Deletion is intentionally a modal confirmation instead of a browser confirm
// dialog. It explains the irreversible action and keeps the product's feedback
// and loading behavior consistent with the existing share dialog.
export function DeleteDocumentDialog({
  document,
  onClose,
  onDeleted,
}: DeleteDocumentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete document");
      }

      toast.success("Document deleted");
      onDeleted(document.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete document",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <section
        aria-describedby="delete-dialog-description"
        aria-labelledby="delete-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" id="delete-dialog-title">
                Delete document?
              </h2>
              <p
                className="mt-1 text-sm leading-6 text-muted-foreground"
                id="delete-dialog-description"
              >
                “{document.title}” and its shared access will be permanently
                removed. This action cannot be undone.
              </p>
            </div>
          </div>
          <Button
            aria-label="Close delete dialog"
            disabled={isDeleting}
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isDeleting} onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => void confirmDelete()}
            type="button"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? "Deleting…" : "Delete document"}
          </Button>
        </div>
      </section>
    </div>
  );
}
