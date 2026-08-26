"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FileDown,
  FileText,
  History,
  ListTree,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DocumentActionsMenuProps = {
  canDelete: boolean;
  canShare: boolean;
  isCommentsOpen: boolean;
  isHistoryOpen: boolean;
  isOutlineOpen: boolean;
  onComments: () => void;
  onDelete: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  onHistory: () => void;
  onOutline: () => void;
  onShare: () => void;
};

type MenuAction = {
  active?: boolean;
  icon: typeof FileDown;
  label: string;
  onClick: () => void;
};

// Secondary document actions share one mobile menu so the editor header can
// preserve space for the title and Save action at narrow widths.
export function DocumentActionsMenu({
  canDelete,
  canShare,
  isCommentsOpen,
  isHistoryOpen,
  isOutlineOpen,
  onComments,
  onDelete,
  onExportMarkdown,
  onExportPdf,
  onHistory,
  onOutline,
  onShare,
}: DocumentActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const actions: MenuAction[] = [
    ...(canShare
      ? [{ icon: Share2, label: "Share and permissions", onClick: onShare }]
      : []),
    ...(canDelete
      ? [{ icon: Trash2, label: "Delete document", onClick: onDelete }]
      : []),
    { active: isOutlineOpen, icon: ListTree, label: "Outline", onClick: onOutline },
    { active: isHistoryOpen, icon: History, label: "Version history", onClick: onHistory },
    { active: isCommentsOpen, icon: MessageSquare, label: "Comments", onClick: onComments },
    { icon: FileText, label: "Export Markdown", onClick: onExportMarkdown },
    { icon: FileDown, label: "Export PDF", onClick: onExportPdf },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        size="sm"
        type="button"
        variant="outline"
      >
        <MoreHorizontal aria-hidden="true" />
        More
        <ChevronDown aria-hidden="true" className="ml-0.5" />
      </Button>
      {isOpen ? (
        <div
          aria-label="Document actions"
          className="absolute right-0 top-full z-30 mt-2 min-w-56 rounded-lg border border-border bg-popover p-1 shadow-lg"
          role="menu"
        >
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                  action.active ? "bg-muted" : ""
                }`}
                key={action.label}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
                role="menuitem"
                type="button"
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="flex-1">{action.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
