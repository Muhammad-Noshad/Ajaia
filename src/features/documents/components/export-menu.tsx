"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportMenuProps = {
  onExportMarkdown: () => void;
  onExportPdf: () => void;
};

// The menu owns only transient open/close state. Export implementations stay
// in the editor because they need the live content and document title.
export function ExportMenu({
  onExportMarkdown,
  onExportPdf,
}: ExportMenuProps) {
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

  function selectExport(exportAction: () => void) {
    setIsOpen(false);
    exportAction();
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        variant="outline"
      >
        <FileDown aria-hidden="true" />
        Export
        <ChevronDown aria-hidden="true" className="ml-0.5" />
      </Button>
      {isOpen ? (
        <div
          aria-label="Export options"
          className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-lg border border-border bg-popover p-1 shadow-lg"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => selectExport(onExportMarkdown)}
            role="menuitem"
            type="button"
          >
            <FileText aria-hidden="true" className="size-4" />
            Markdown (.md)
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => selectExport(onExportPdf)}
            role="menuitem"
            type="button"
          >
            <FileDown aria-hidden="true" className="size-4" />
            PDF (Print)
          </button>
        </div>
      ) : null}
    </div>
  );
}
