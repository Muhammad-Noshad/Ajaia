"use client";

import { useForm, useWatch } from "react-hook-form";
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

// Owners use this form both to grant access and to update an existing user's
// role. The server still validates the target and ownership independently.
export function ShareDialog({
  currentUserId,
  document,
  onClose,
  onShared,
}: ShareDialogProps) {
  const availableUsers = DEMO_USERS.filter(
    (user) => user.id !== currentUserId && user.id !== document.ownerId,
  );
  const { control, handleSubmit, register, setValue, formState } =
    useForm<ShareDocumentInput>({
      defaultValues: {
        userId: availableUsers[0]?.id ?? "",
        role: availableUsers[0]
          ? document.sharedRoles[availableUsers[0].id] ?? "editor"
          : "editor",
      },
      resolver: zodResolver(shareDocumentSchema),
    });
  const selectedUserId = useWatch({ control, name: "userId" });
  const isExistingShare = document.sharedWith.includes(selectedUserId);
  const userField = register("userId");

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
        throw new Error(result.error ?? "Unable to update document access");
      }

      onShared(result.document);
      toast.success(isExistingShare ? "Access updated" : "Document shared");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update document access",
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
              Choose who can access this document and what they can do.
            </p>
          </div>
          <Button
            aria-label="Close share dialog"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
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
                {...userField}
                onChange={(event) => {
                  userField.onChange(event);
                  setValue(
                    "role",
                    document.sharedRoles[event.target.value] ?? "editor",
                  );
                }}
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
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="share-role">
                Permission
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="share-role"
                {...register("role")}
              >
                <option value="editor">Editor — can edit and restore versions</option>
                <option value="viewer">Viewer — can view, preview, and export</option>
              </select>
            </div>
            <Button disabled={formState.isSubmitting} type="submit">
              <UserPlus aria-hidden="true" />
              {formState.isSubmitting
                ? "Saving…"
                : isExistingShare
                  ? "Update access"
                  : "Share document"}
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            There are no other demo users available to share with.
          </p>
        )}
        {document.sharedWith.length > 0 ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current access
            </p>
            <ul className="mt-3 space-y-2">
              {document.sharedWith.map((userId) => {
                const user = DEMO_USERS.find((candidate) => candidate.id === userId);
                const role = document.sharedRoles[userId] ?? "editor";

                return (
                  <li
                    className="flex items-center justify-between gap-3 text-sm"
                    key={userId}
                  >
                    <span className="truncate">{user?.name ?? userId}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {role === "editor" ? "Editor" : "Viewer"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
