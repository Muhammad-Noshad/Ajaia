"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  History,
  ListTree,
  Loader2,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DocumentOutline } from "@/features/documents/components/document-outline";
import { DeleteDocumentDialog } from "@/features/documents/components/delete-document-dialog";
import { VersionHistory } from "@/features/documents/components/version-history";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import { ExportMenu } from "@/features/documents/components/export-menu";
import type { DocumentView } from "@/features/documents/document.types";

type DocumentEditorProps = {
  document: DocumentView;
  currentUserId: string;
  onSaved: (document: DocumentView) => void;
  onShare: () => void;
  onDeleted: (documentId: string) => void;
};

type SaveOptions = {
  notify?: boolean;
};

const AUTOSAVE_DELAY_MS = 1200;

function getSafeExportFilename(title: string, extension: "md" | "pdf") {
  const safeTitle = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, "-")
    .replace(/\s+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^\.+|\.+$/gu, "")
    .slice(0, 80);

  return `${safeTitle || "untitled-document"}.${extension}`;
}

// Export uses the live editor state so users can download work before an
// autosave completes. The title is stored separately from Tiptap content, so
// it is added as the Markdown document heading here.
function exportMarkdown(editor: Editor, title: string) {
  const markdownTitle = title.trim().replace(/[\r\n]+/gu, " ") || "Untitled document";
  const body = editor.getMarkdown().trim();
  const markdown = body
    ? `# ${markdownTitle}\n\n${body}\n`
    : `# ${markdownTitle}\n`;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = getSafeExportFilename(markdownTitle, "md");
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Markdown exported");
}

// PDF export deliberately uses the browser print pipeline. Print CSS hides
// app chrome and expands the editor canvas, producing a faithful PDF without
// introducing a second HTML-to-PDF renderer or a large client dependency.
function exportPdf(title: string) {
  const previousTitle = document.title;
  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };

  document.title = getSafeExportFilename(title, "pdf");
  window.addEventListener("afterprint", restoreTitle, { once: true });
  window.print();
}

function formatSavedTime(savedAt: Date | null) {
  if (!savedAt || Number.isNaN(savedAt.getTime())) {
    return "Saved";
  }

  return `Saved at ${savedAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

// This component owns only transient editor/title state. The parent owns the
// selected document, and the server remains the source of truth after saving.
export function DocumentEditor({
  currentUserId,
  document,
  onSaved,
  onShare,
  onDeleted,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [changeVersion, setChangeVersion] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(
    () => new Date(document.updatedAt),
  );
  const changeVersionRef = useRef(0);
  const lastAutosavedVersionRef = useRef(-1);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: document.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-5 py-6 text-base leading-8 outline-none sm:px-10",
        "aria-label": "Document content",
      },
    },
    onUpdate: () => {
      changeVersionRef.current += 1;
      setChangeVersion(changeVersionRef.current);
      setIsDirty(true);
      setSaveError(null);
    },
  });

  const editorText = editor?.getText() ?? "";
  const trimmedEditorText = editorText.trim();
  const editorStats = {
    characters: Array.from(editorText).length,
    words: trimmedEditorText ? trimmedEditorText.split(/\s+/u).length : 0,
  };

  const saveDocument = useCallback(
    async function saveDocument({ notify = true }: SaveOptions = {}) {
      if (!editor || isSaving || !isDirty) {
        return;
      }

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }

      const requestVersion = changeVersionRef.current;
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/documents/${document.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled document",
            content: editor.getJSON(),
          }),
        });

        const result = (await response.json()) as {
          document?: DocumentView;
          error?: string;
        };

        if (!response.ok || !result.document) {
          throw new Error(result.error ?? "Unable to save document");
        }

        // A user may continue typing while the request is in flight. Only
        // clear the dirty state when the response represents the latest edit;
        // otherwise the next autosave must preserve the newer local changes.
        const hasNewerChanges = changeVersionRef.current !== requestVersion;
        if (!hasNewerChanges) {
          setTitle(result.document.title);
          setIsDirty(false);
          setLastSavedAt(new Date(result.document.updatedAt));
          onSaved(result.document);
        }

        if (notify) {
          toast.success("Document saved");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save document";
        setSaveError(message);
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [document.id, editor, isDirty, isSaving, onSaved, title],
  );

  // Debounce autosave by edit version rather than only dirty state. This makes
  // edits during a request observable and prevents a failed version from
  // retrying forever without a new user action.
  useEffect(() => {
    if (
      !editor ||
      !isDirty ||
      isSaving ||
      changeVersion === lastAutosavedVersionRef.current
    ) {
      return;
    }

    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      lastAutosavedVersionRef.current = changeVersion;
      void saveDocument({ notify: false });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [changeVersion, editor, isDirty, isSaving, saveDocument]);

  function markDirty() {
    changeVersionRef.current += 1;
    setChangeVersion(changeVersionRef.current);
    setIsDirty(true);
    setSaveError(null);
  }

  function openDeleteDialog() {
    // A pending autosave is no longer useful once the user has chosen to
    // remove the document. Clearing it prevents a delayed write from racing
    // with the DELETE request while the confirmation modal is open.
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    setIsDeleteDialogOpen(true);
  }

  function toggleHistory() {
    setIsHistoryOpen((current) => !current);
    setIsOutlineOpen(false);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card print:block print:h-auto print:overflow-visible">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6 print:block print:border-0 print:px-0 print:py-0">
        <label className="sr-only" htmlFor="document-title">
          Document title
        </label>
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring print:hidden"
          id="document-title"
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            markDirty();
          }}
          placeholder="Untitled document"
          value={title}
        />
        <h1 className="hidden text-2xl font-bold print:block print:pb-5">
          {title.trim() || "Untitled document"}
        </h1>
        <div className="flex items-center gap-3 print:hidden">
          <span className="text-xs text-muted-foreground" role="status">
            {isSaving ? (
              <>
                <Loader2 aria-hidden="true" className="mr-1 inline size-3 animate-spin" />
                Saving
              </>
            ) : isDirty ? (
              saveError ? "Save failed — retry" : "Unsaved changes"
            ) : (
              <>
                <Check aria-hidden="true" className="mr-1 inline size-3" />
                {formatSavedTime(lastSavedAt)}
              </>
            )}
          </span>
          {document.ownerId === currentUserId ? (
            <>
              <Button onClick={onShare} type="button" variant="outline">
                <Share2 aria-hidden="true" />
                Share
              </Button>
              <Button
                disabled={isSaving}
                onClick={openDeleteDialog}
                title={isSaving ? "Wait for saving to finish" : "Delete document"}
                type="button"
                variant="outline"
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            </>
          ) : null}
          <Button
            aria-pressed={isOutlineOpen}
            onClick={() => {
              setIsOutlineOpen((current) => !current);
              setIsHistoryOpen(false);
            }}
            type="button"
            variant="outline"
          >
            <ListTree aria-hidden="true" />
            Outline
          </Button>
          <Button
            aria-pressed={isHistoryOpen}
            onClick={toggleHistory}
            type="button"
            variant="outline"
          >
            <History aria-hidden="true" />
            History
          </Button>
          <ExportMenu
            onExportMarkdown={() => {
              if (editor) {
                exportMarkdown(editor, title);
              }
            }}
            onExportPdf={() => exportPdf(title)}
          />
          <Button
            disabled={!isDirty || isSaving}
            onClick={() => void saveDocument()}
            type="button"
          >
            {isSaving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
            Save
          </Button>
        </div>
      </header>
      <div className="shrink-0 print:hidden">
        <DocumentToolbar editor={editor} />
      </div>
      <div className="relative flex min-h-0 flex-1 print:block print:h-auto print:overflow-visible">
        <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain print:block print:h-auto print:overflow-visible">
          <EditorContent editor={editor} />
        </div>
        {isOutlineOpen ? (
          <DocumentOutline
            editor={editor}
            onClose={() => setIsOutlineOpen(false)}
          />
        ) : null}
        {isHistoryOpen ? (
          <VersionHistory
            document={document}
            onClose={() => setIsHistoryOpen(false)}
            onRestored={(restoredDocument) => {
              editor?.commands.setContent(restoredDocument.content, {
                emitUpdate: false,
              });
              setTitle(restoredDocument.title);
              setIsDirty(false);
              setSaveError(null);
              setLastSavedAt(new Date(restoredDocument.updatedAt));
              lastAutosavedVersionRef.current = changeVersionRef.current;
              onSaved(restoredDocument);
            }}
          />
        ) : null}
      </div>
      <footer
        aria-label="Document statistics"
        className="flex shrink-0 items-center justify-between gap-4 border-t border-border px-5 py-2 text-xs text-muted-foreground sm:px-10 print:hidden"
      >
        <span>{editorStats.words.toLocaleString()} words</span>
        <span>{editorStats.characters.toLocaleString()} characters</span>
      </footer>
      {isDeleteDialogOpen ? (
        <DeleteDocumentDialog
          document={document}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={onDeleted}
        />
      ) : null}
    </section>
  );
}
