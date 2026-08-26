"use client";

import { FileText, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocumentView } from "@/features/documents/document.types";

type DocumentSidebarProps = {
  documents: DocumentView[];
  selectedDocumentId: string | null;
  currentUserId: string;
  currentUserName: string;
  isCreating: boolean;
  onCreate: () => void;
  onSelect: (documentId: string) => void;
};

// The sidebar renders server-provided ownership metadata and does not infer
// access from client state. That keeps the owned/shared distinction consistent.
export function DocumentSidebar({
  documents,
  selectedDocumentId,
  currentUserId,
  currentUserName,
  isCreating,
  onCreate,
  onSelect,
}: DocumentSidebarProps) {
  return (
    <aside className="hidden w-full shrink-0 flex-col border-b border-border bg-muted/30 min-[901px]:flex min-[901px]:h-full min-[901px]:min-h-0 min-[901px]:w-72 min-[901px]:overflow-y-auto min-[901px]:border-b-0 min-[901px]:border-r print:hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Your workspace</p>
          <p className="truncate text-xs text-muted-foreground">{currentUserName}</p>
        </div>
        <Button
          aria-label="Create document"
          disabled={isCreating}
          onClick={onCreate}
          size="icon"
          type="button"
        >
          {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </div>
      <div className="block space-y-1 overflow-visible p-3">
        {documents.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No documents yet. Create your first one.
          </p>
        ) : (
          documents.map((document) => {
            const isSelected = document.id === selectedDocumentId;
            const isOwned = document.ownerId === currentUserId;

            return (
              <button
                aria-current={isSelected ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                key={document.id}
                onClick={() => onSelect(document.id)}
                type="button"
              >
                <FileText aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {document.title}
                  </span>
                  <span
                    className={`block text-xs ${
                      isSelected
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isOwned
                      ? "Owned"
                      : document.sharedRoles[currentUserId] === "viewer"
                        ? "Shared · Viewer"
                        : "Shared · Editor"}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
