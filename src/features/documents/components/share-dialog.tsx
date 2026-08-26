"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  shareDocumentSchema,
  type ShareDocumentInput,
} from "@/features/documents/document.schema";
import type { DocumentView } from "@/features/documents/document.types";
import { DEMO_USERS } from "@/features/session/demo-users";

type ShareDialogProps = {
  currentUserId: string;
  document: DocumentView;
  onClose: () => void;
  onShared: (document: DocumentView) => void;
};

// Sharing is a form boundary: Zod validates the submitted identity, while the
// service independently verifies ownership and that the target user is known.
export function ShareDialog({
  currentUserId,
  document,
  onClose,
  onShared,
}: ShareDialogProps) {
  const availableUsers = DEMO_USERS.filter(
    (user) =>
      user.id !== currentUserId && !document.sharedWith.includes(user.id),
  );
  const { register, handleSubmit, formState } = useForm<ShareDocumentInput>({
    defaultValues: { userId: availableUsers[0]?.id ?? "" },
    resolver: zodResolver(shareDocumentSchema),
  });

  async function submitShare(input: ShareDocumentInput) {
    try {
      const response = await fetch(`/api/documents/${document.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as {
        document?: DocumentView;
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to share document");
      }

      onShared(result.document);
      toast.success("Document shared");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to share document",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <section
        aria-labelledby="share-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="share-dialog-title">
              Share document
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give another demo user edit access to “{document.title}”.
            </p>
          </div>
          <Button aria-label="Close share dialog" onClick={onClose} size="icon" type="button" variant="ghost">
            <X />
          </Button>
        </div>
        {availableUsers.length > 0 ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(submitShare)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="share-user">
                User
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="share-user"
                {...register("userId")}
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {formState.errors.userId ? (
                <p className="text-xs text-destructive">
                  {formState.errors.userId.message}
                </p>
              ) : null}
            </div>
            <Button disabled={formState.isSubmitting} type="submit">
              <UserPlus aria-hidden="true" />
              {formState.isSubmitting ? "Sharing…" : "Share document"}
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            This document is already shared with every other demo user.
          </p>
        )}
      </section>
    </div>
  );
}
