"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  CommentView,
  DocumentView,
} from "@/features/documents/document.types";

type CommentDialogProps = {
  anchor: { from: number; to: number; quote: string };
  document: DocumentView;
  onClose: () => void;
  onCreated: (comment: CommentView) => void;
};

// Comment creation is kept separate from document saving. Comments are
// metadata, so viewers can create them without mutating the read-only content.
export function CommentDialog({
  anchor,
  document,
  onClose,
  onCreated,
}: CommentDialogProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitComment() {
    const trimmedText = text.trim();

    if (!trimmedText || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/documents/${document.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...anchor, text: trimmedText }),
      });
      const result = (await response.json()) as {
        comment?: CommentView;
        error?: string;
      };

      if (!response.ok || !result.comment) {
        throw new Error(result.error ?? "Unable to add comment");
      }

      onCreated(result.comment);
      toast.success("Comment added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <section
        aria-describedby="comment-dialog-description"
        aria-labelledby="comment-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold" id="comment-dialog-title">
              <MessageSquare aria-hidden="true" className="size-5" />
              Add comment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" id="comment-dialog-description">
              Add feedback about the selected text.
            </p>
          </div>
          <Button
            aria-label="Close comment dialog"
            disabled={isSubmitting}
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <blockquote className="mt-5 rounded-lg border-l-2 border-brand-indigo bg-muted/50 px-4 py-3 text-sm italic text-muted-foreground">
          “{anchor.quote}”
        </blockquote>
        <label className="mt-5 block space-y-2" htmlFor="comment-text">
          <span className="text-sm font-medium">Comment</span>
          <textarea
            autoFocus
            className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id="comment-text"
            maxLength={2_000}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a helpful note…"
            value={text}
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!text.trim() || isSubmitting}
            onClick={() => void submitComment()}
            type="button"
          >
            {isSubmitting ? "Adding…" : "Add comment"}
          </Button>
        </div>
      </section>
    </div>
  );
}
