"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DocumentView } from "@/features/documents/document.types";

type ImportDocumentButtonProps = {
  onImported: (document: DocumentView) => void;
};

const MAX_IMPORT_BYTES = 1_000_000;

// The browser sends the selected text file as multipart form data. The server
// validates the type and size again, so this check is only immediate UX feedback.
export function ImportDocumentButton({ onImported }: ImportDocumentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function importFile(file: File) {
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("Files must be smaller than 1 MB");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        document?: DocumentView;
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to import file");
      }

      onImported(result.document);
      toast.success("File imported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import file");
    } finally {
      setIsImporting(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <input
        accept=".txt,.md,text/plain,text/markdown"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importFile(file);
          }
        }}
        ref={inputRef}
        type="file"
      />
      <Button
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
        size="sm"
        type="button"
        variant="outline"
      >
        {isImporting ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <FileUp aria-hidden="true" />
        )}
        Import
      </Button>
    </>
  );
}
