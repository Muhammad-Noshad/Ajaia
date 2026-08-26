"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, ListTree, Loader2, Save, Share2 } from "lucide-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import { DocumentOutline } from "@/features/documents/components/document-outline";
import type { DocumentView } from "@/features/documents/document.types";

type DocumentEditorProps = {
  document: DocumentView;
  currentUserId: string;
  onSaved: (document: DocumentView) => void;
  onShare: () => void;
};

type SaveOptions = {
  notify?: boolean;
};

const AUTOSAVE_DELAY_MS = 1200;

function getSafeMarkdownFilename(title: string) {
  const safeTitle = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, "-")
    .replace(/\s+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^\.+|\.+$/gu, "")
    .slice(0, 80);

  return `${safeTitle || "untitled-document"}.md`;
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
  anchor.download = getSafeMarkdownFilename(markdownTitle);
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Markdown exported");
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
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
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

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <label className="sr-only" htmlFor="document-title">
          Document title
        </label>
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          id="document-title"
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            markDirty();
          }}
          placeholder="Untitled document"
          value={title}
        />
        <div className="flex items-center gap-3">
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
            <Button onClick={onShare} type="button" variant="outline">
              <Share2 aria-hidden="true" />
              Share
            </Button>
          ) : null}
          <Button
            aria-pressed={isOutlineOpen}
            onClick={() => setIsOutlineOpen((current) => !current)}
            type="button"
            variant="outline"
          >
            <ListTree aria-hidden="true" />
            Outline
          </Button>
          <Button
            disabled={!editor}
            onClick={() => {
              if (editor) {
                exportMarkdown(editor, title);
              }
            }}
            type="button"
            variant="outline"
          >
            <Download aria-hidden="true" />
            Export .md
          </Button>
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
      <div className="shrink-0">
        <DocumentToolbar editor={editor} />
      </div>
      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <EditorContent editor={editor} />
        </div>
        {isOutlineOpen ? (
          <DocumentOutline
            editor={editor}
            onClose={() => setIsOutlineOpen(false)}
          />
        ) : null}
      </div>
      <footer
        aria-label="Document statistics"
        className="flex shrink-0 items-center justify-between gap-4 border-t border-border px-5 py-2 text-xs text-muted-foreground sm:px-10"
      >
        <span>{editorStats.words.toLocaleString()} words</span>
        <span>{editorStats.characters.toLocaleString()} characters</span>
      </footer>
    </section>
  );
}
