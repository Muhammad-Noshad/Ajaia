"use client";

import { useState } from "react";
import { Check, Loader2, Save, Share2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import type { DocumentView } from "@/features/documents/document.types";

type DocumentEditorProps = {
  document: DocumentView;
  currentUserId: string;
  onSaved: (document: DocumentView) => void;
  onShare: () => void;
};

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

  const editor = useEditor({
    extensions: [StarterKit],
    content: document.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-5 py-6 text-base leading-8 outline-none sm:px-10",
      },
    },
    onUpdate: () => setIsDirty(true),
  });

  async function saveDocument() {
    if (!editor || isSaving) {
      return;
    }

    setIsSaving(true);

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

      setTitle(result.document.title);
      setIsDirty(false);
      onSaved(result.document);
      toast.success("Document saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save document",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <label className="sr-only" htmlFor="document-title">
          Document title
        </label>
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          id="document-title"
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setIsDirty(true);
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
              "Unsaved changes"
            ) : (
              <>
                <Check aria-hidden="true" className="mr-1 inline size-3" />
                Saved
              </>
            )}
          </span>
          {document.ownerId === currentUserId ? (
            <Button onClick={onShare} type="button" variant="outline">
              <Share2 aria-hidden="true" />
              Share
            </Button>
          ) : null}
          <Button disabled={!isDirty || isSaving} onClick={saveDocument} type="button">
            {isSaving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
            Save
          </Button>
        </div>
      </header>
      <DocumentToolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
