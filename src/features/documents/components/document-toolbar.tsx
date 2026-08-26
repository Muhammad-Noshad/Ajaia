"use client";

import { useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { useEditorState, type Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { LinkDialog } from "@/features/documents/components/link-dialog";

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

const EMPTY_EDITOR_STATE = {
  canRedo: false,
  canUndo: false,
  isBlockquote: false,
  isBold: false,
  isBulletList: false,
  isCodeBlock: false,
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isItalic: false,
  isLink: false,
  isOrderedList: false,
  isStrike: false,
  isUnderline: false,
} as const;

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

// This component is a thin command surface over Tiptap's StarterKit. Tiptap
// owns history, selection, and formatting state; the toolbar only dispatches
// commands and derives active/available states from the current editor.
export function DocumentToolbar({ editor }: DocumentToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [initialLinkHref, setInitialLinkHref] = useState("");
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return EMPTY_EDITOR_STATE;
      }

      // Tiptap emits a transaction for edits, selection changes, undo, and
      // redo. Subscribing here keeps button state synchronized with history
      // instead of relying on unrelated React state to trigger a rerender.
      return {
        canRedo: currentEditor.can().chain().focus().redo().run(),
        canUndo: currentEditor.can().chain().focus().undo().run(),
        isBlockquote: currentEditor.isActive("blockquote"),
        isBold: currentEditor.isActive("bold"),
        isBulletList: currentEditor.isActive("bulletList"),
        isCodeBlock: currentEditor.isActive("codeBlock"),
        isHeading1: currentEditor.isActive("heading", { level: 1 }),
        isHeading2: currentEditor.isActive("heading", { level: 2 }),
        isHeading3: currentEditor.isActive("heading", { level: 3 }),
        isItalic: currentEditor.isActive("italic"),
        isLink: currentEditor.isActive("link"),
        isOrderedList: currentEditor.isActive("orderedList"),
        isStrike: currentEditor.isActive("strike"),
        isUnderline: currentEditor.isActive("underline"),
      };
    },
  }) ?? EMPTY_EDITOR_STATE;

  if (!editor) {
    return null;
  }

  const activeEditor = editor;

  function openLinkDialog() {
    setInitialLinkHref(
      (activeEditor.getAttributes("link").href as string | undefined) ?? "",
    );
    setIsLinkDialogOpen(true);
  }

  return (
    <>
      <div
        aria-label="Formatting toolbar"
        className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2"
        role="toolbar"
      >
      <ToolbarButton
        disabled={!editorState.canUndo}
        icon={Undo2}
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        disabled={!editorState.canRedo}
        icon={Redo2}
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editorState.isBold}
        icon={Bold}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={editorState.isItalic}
        icon={Italic}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={editorState.isUnderline}
        icon={Underline}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        active={editorState.isStrike}
        icon={Strikethrough}
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        active={editorState.isLink}
        icon={Link}
        label={editorState.isLink ? "Edit link" : "Add link"}
        onClick={openLinkDialog}
      />
      <ToolbarButton
        icon={RemoveFormatting}
        label="Clear formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editorState.isHeading1}
        icon={Heading1}
        label="Heading 1"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      />
      <ToolbarButton
        active={editorState.isHeading2}
        icon={Heading2}
        label="Heading 2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        active={editorState.isHeading3}
        icon={Heading3}
        label="Heading 3"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />
      <ToolbarButton
        active={editorState.isBlockquote}
        icon={Quote}
        label="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        active={editorState.isCodeBlock}
        icon={Code2}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editorState.isBulletList}
        icon={List}
        label="Bulleted list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={editorState.isOrderedList}
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
      {isLinkDialogOpen ? (
        <LinkDialog
          editor={editor}
          initialHref={initialLinkHref}
          onClose={() => setIsLinkDialogOpen(false)}
        />
      ) : null}
    </>
  );
}
