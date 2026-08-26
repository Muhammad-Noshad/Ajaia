"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type DocumentOutlineProps = {
  editor: Editor | null;
  onClose: () => void;
};

type OutlineHeading = {
  level: number;
  position: number;
  text: string;
};

function getOutline(editor: Editor | null): OutlineHeading[] {
  if (!editor) {
    return [];
  }

  const headings: OutlineHeading[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name !== "heading") {
      return;
    }

    headings.push({
      level: Number(node.attrs.level) || 1,
      position: position + 1,
      text: node.textContent.trim().replace(/\s+/gu, " ") || "Untitled heading",
    });
  });

  return headings;
}

// The outline is derived from the live Tiptap document. It stores no duplicate
// content; clicking an entry moves the editor selection to the source node and
// asks the editor's scroll container to reveal it.
export function DocumentOutline({ editor, onClose }: DocumentOutlineProps) {
  const headings =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => getOutline(currentEditor),
    }) ?? [];

  function navigateToHeading(position: number) {
    editor?.chain().focus().setTextSelection(position).scrollIntoView().run();
  }

  return (
    <>
      <button
        aria-label="Close document outline"
        className="absolute inset-0 z-10 bg-foreground/20 min-[901px]:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute inset-y-0 right-0 z-20 flex w-72 shrink-0 flex-col border-l border-border bg-card shadow-xl min-[901px]:relative min-[901px]:z-0 min-[901px]:w-64 min-[901px]:shadow-none">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Document outline</h2>
            <p className="text-xs text-muted-foreground">
              {headings.length} {headings.length === 1 ? "heading" : "headings"}
            </p>
          </div>
          <Button
            aria-label="Close document outline"
            onClick={onClose}
            size="icon-sm"
            title="Close document outline"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </header>
        <nav
          aria-label="Document headings"
          className="min-h-0 flex-1 overflow-y-auto p-3"
        >
          {headings.length > 0 ? (
            <ol className="space-y-1">
              {headings.map((heading, index) => (
                <li key={`${heading.position}-${index}`}>
                  <button
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => navigateToHeading(heading.position)}
                    style={{ paddingLeft: `${0.5 + (heading.level - 1) * 0.75}rem` }}
                    type="button"
                  >
                    <span className="line-clamp-2">{heading.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-2 py-3 text-sm leading-6 text-muted-foreground">
              Add Heading 1, 2, or 3 styles to build an outline.
            </p>
          )}
        </nav>
      </aside>
    </>
  );
}
