"use client";

import { Bold, Heading1, Italic, List, ListOrdered, Underline } from "lucide-react";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";

type DocumentToolbarProps = {
  editor: Editor | null;
};

// The toolbar is deliberately a thin command surface over Tiptap. Formatting
// state is derived from the editor, so controls cannot drift from the content.
export function DocumentToolbar({ editor }: DocumentToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div
      aria-label="Formatting toolbar"
      className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2"
      role="toolbar"
    >
      <Button
        aria-label="Bold"
        aria-pressed={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Bold />
      </Button>
      <Button
        aria-label="Italic"
        aria-pressed={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Italic />
      </Button>
      <Button
        aria-label="Underline"
        aria-pressed={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Underline />
      </Button>
      <Button
        aria-label="Heading 1"
        aria-pressed={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        size="sm"
        type="button"
        variant="ghost"
      >
        <Heading1 />
      </Button>
      <Button
        aria-label="Bulleted list"
        aria-pressed={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        size="sm"
        type="button"
        variant="ghost"
      >
        <List />
      </Button>
      <Button
        aria-label="Numbered list"
        aria-pressed={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ListOrdered />
      </Button>
    </div>
  );
}
