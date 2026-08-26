"use client";

import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  SeparatorHorizontal,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";

type DocumentToolbarProps = {
  editor: Editor | null;
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

// Toolbar buttons all follow the same accessibility and focus behavior. Keeping
// that contract in one component prevents new commands from becoming icon-only
// or losing their pressed/disabled state as the editor grows.
function ToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      size="sm"
      title={label}
      type="button"
      variant="ghost"
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

// Link marks need a URL input, but the editor still owns the resulting mark and
// persistence remains unchanged. Existing links are removed with the same
// control, which keeps the toolbar useful without adding another form surface.
function toggleLink(editor: Editor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  const href = window.prompt("Enter a URL", "https://");
  if (!href?.trim()) {
    return;
  }

  const normalizedHref = /^https?:\/\//i.test(href.trim())
    ? href.trim()
    : `https://${href.trim()}`;

  editor
    .chain()
    .focus()
    .setLink({
      href: normalizedHref,
      target: "_blank",
      rel: "noopener noreferrer",
    })
    .run();
}

// This component is a thin command surface over Tiptap's StarterKit. Tiptap
// owns history, selection, and formatting state; the toolbar only dispatches
// commands and derives active/available states from the current editor.
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
      <ToolbarButton
        disabled={!editor.can().chain().focus().undo().run()}
        icon={Undo2}
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        disabled={!editor.can().chain().focus().redo().run()}
        icon={Redo2}
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editor.isActive("bold")}
        icon={Bold}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        icon={Italic}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={editor.isActive("underline")}
        icon={Underline}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        active={editor.isActive("strike")}
        icon={Strikethrough}
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        active={editor.isActive("link")}
        icon={editor.isActive("link") ? Unlink : Link}
        label={editor.isActive("link") ? "Remove link" : "Add link"}
        onClick={() => toggleLink(editor)}
      />
      <ToolbarButton
        icon={RemoveFormatting}
        label="Clear formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        icon={Heading1}
        label="Heading 1"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
        label="Heading 2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        icon={Heading3}
        label="Heading 3"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        icon={Quote}
        label="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        icon={Code2}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        icon={List}
        label="Bulleted list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        icon={ListOrdered}
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={SeparatorHorizontal}
        label="Insert divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
    </div>
  );
}
