"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DocumentEditor } from "@/features/documents/components/document-editor";
import { DocumentSidebar } from "@/features/documents/components/document-sidebar";
import { ImportDocumentButton } from "@/features/documents/components/import-document-button";
import { ShareDialog } from "@/features/documents/components/share-dialog";
import { emptyDocumentContent } from "@/features/documents/document.schema";
import type { DocumentView } from "@/features/documents/document.types";
import type { DemoUser } from "@/features/session/demo-users";
import { DemoUserSwitcher } from "@/features/session/components/demo-user-switcher";

type DocumentsResponse = {
  documents: DocumentView[];
  currentUser: DemoUser;
};

// This client boundary owns selection and network feedback. Document business
// rules stay on the server; successful responses replace local records so the
// UI reflects persisted state rather than assuming a mutation succeeded.
export function DocumentWorkspace() {
  const [documents, setDocuments] = useState<DocumentView[]>([]);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const requestDocuments = useCallback(async function requestDocuments() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    const result = (await response.json()) as Partial<DocumentsResponse> & {
      error?: string;
    };

    if (!response.ok || !result.documents || !result.currentUser) {
      throw new Error(result.error ?? "Unable to load documents");
    }

    return result as DocumentsResponse;
  }, []);

  const applyDocuments = useCallback((result: DocumentsResponse) => {
    setDocuments(result.documents);
    setCurrentUser(result.currentUser);
    setSelectedDocumentId((currentId) =>
      result.documents.some((document) => document.id === currentId)
        ? currentId
        : result.documents[0]?.id ?? null,
    );
  }, []);

  useEffect(() => {
    let isActive = true;

    requestDocuments()
      .then((result) => {
        if (isActive) {
          applyDocuments(result);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load documents",
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
  }, [applyDocuments, requestDocuments]);

  // Close a mobile drawer that was opened before a viewport resize crosses
  // into the desktop layout. This avoids stale overlay state when resizing.
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileSidebarOpen]);

  async function retryLoad() {
    setIsLoading(true);
    setLoadError(null);

    try {
      applyDocuments(await requestDocuments());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load documents",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const documentToShare = useMemo(
    () => documents.find((document) => document.id === shareDocumentId) ?? null,
    [documents, shareDocumentId],
  );

  async function createDocument() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled document",
            content: emptyDocumentContent,
        }),
      });
      const result = (await response.json()) as {
        document?: DocumentView;
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to create document");
      }

      setDocuments((currentDocuments) => [result.document!, ...currentDocuments]);
      setSelectedDocumentId(result.document.id);
      setIsMobileSidebarOpen(false);
      toast.success("Document created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create document",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleSaved(updatedDocument: DocumentView) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document,
      ),
    );
  }

  function handleImported(importedDocument: DocumentView) {
    setDocuments((currentDocuments) => [importedDocument, ...currentDocuments]);
    setSelectedDocumentId(importedDocument.id);
  }

  function handleShared(updatedDocument: DocumentView) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document,
      ),
    );
  }

  function handleDeleted(documentId: string) {
    const nextDocument = documents.find((document) => document.id !== documentId);

    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.id !== documentId),
    );
    setSelectedDocumentId((currentId) =>
      currentId === documentId ? nextDocument?.id ?? null : currentId,
    );
    setShareDocumentId(null);
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background print:h-auto print:overflow-visible">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-3 py-3 sm:px-6 sm:py-4 min-[901px]:px-8 print:hidden">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-indigo text-primary-foreground">
          <FileText aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">Ajaia Docs</p>
          <p className="text-xs text-muted-foreground">Focused work, clearly shared.</p>
        </div>
        <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          {currentUser ? (
            <>
              <ImportDocumentButton onImported={handleImported} />
              <DemoUserSwitcher currentUser={currentUser} />
            </>
          ) : null}
        </div>
      </header>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your documents…
        </div>
      ) : loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <button
            className="text-sm font-medium underline underline-offset-4"
            onClick={() => void retryLoad()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden min-[901px]:flex-row print:block print:h-auto print:overflow-visible">
          <DocumentSidebar
            className="hidden min-[901px]:flex min-[901px]:h-full min-[901px]:min-h-0 min-[901px]:w-72 min-[901px]:overflow-y-auto min-[901px]:border-b-0 min-[901px]:border-r"
            currentUserId={currentUser?.id ?? ""}
            currentUserName={currentUser?.name ?? "Demo user"}
            documents={documents}
            isCreating={isCreating}
            onCreate={() => void createDocument()}
            onSelect={setSelectedDocumentId}
            selectedDocumentId={selectedDocumentId}
          />
          {selectedDocument ? (
            <DocumentEditor
              currentUserId={currentUser?.id ?? ""}
              document={selectedDocument}
              key={selectedDocument.id}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
              onShare={() => setShareDocumentId(selectedDocument.id)}
            />
          ) : (
            <section className="flex flex-1 items-center justify-center px-6 py-16 text-center">
              <div className="max-w-sm space-y-3">
                <h1 className="text-xl font-semibold">Your workspace is ready</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Create a document to start writing and save your first piece of work.
                </p>
                <button
                  className="text-sm font-medium text-primary underline underline-offset-4"
                  onClick={() => void createDocument()}
                  type="button"
                >
                  Create a document
                </button>
              </div>
            </section>
          )}
          {isMobileSidebarOpen && currentUser ? (
            <div
              aria-label="Workspace documents"
              aria-modal="true"
              className="absolute inset-0 z-30 min-[901px]:hidden"
              role="dialog"
            >
              <button
                aria-label="Close workspace documents"
                className="absolute inset-0 bg-foreground/20"
                onClick={() => setIsMobileSidebarOpen(false)}
                type="button"
              />
              <DocumentSidebar
                className="absolute inset-y-0 left-0 z-10 flex h-full w-[min(20rem,88vw)] overflow-y-auto border-r bg-card shadow-xl"
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                documents={documents}
                isCreating={isCreating}
                onClose={() => setIsMobileSidebarOpen(false)}
                onCreate={() => void createDocument()}
                onSelect={(documentId) => {
                  setSelectedDocumentId(documentId);
                  setIsMobileSidebarOpen(false);
                }}
                selectedDocumentId={selectedDocumentId}
              />
            </div>
          ) : null}
        </div>
      )}
      {documentToShare && currentUser ? (
        <ShareDialog
          currentUserId={currentUser.id}
          document={documentToShare}
          onClose={() => setShareDocumentId(null)}
          onShared={handleShared}
        />
      ) : null}
    </main>
  );
}
