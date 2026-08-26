"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Unlink, X } from "lucide-react";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";

type LinkDialogProps = {
  editor: Editor;
  initialHref: string;
  onClose: () => void;
};

// This dialog owns only URL input and validation. The editor remains the source
// of truth for the selection and link mark, so canceling never mutates content.
export function LinkDialog({
  editor,
  initialHref,
  onClose,
}: LinkDialogProps) {
  const [href, setHref] = useState(initialHref);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select the current URL when opened, matching the quick-edit flow
  // users expect from document editors and keeping keyboard entry immediate.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function closeDialog() {
    onClose();
    editor.chain().focus().run();
  }

  function submitLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = href.trim();
    if (!value) {
      setError("Enter a URL to add a link.");
      return;
    }

    const normalizedHref = /^(https?:\/\/|mailto:)/i.test(value)
      ? value
      : `https://${value}`;

    try {
      new URL(normalizedHref);
    } catch {
      setError("Enter a valid web address or email link.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: normalizedHref,
        target: "_blank",
        rel: "noopener noreferrer",
      })
      .run();
    closeDialog();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    closeDialog();
  }

  return (
    <dialog
      aria-describedby="link-dialog-description"
      aria-labelledby="link-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-w-none items-center justify-center border-0 bg-transparent p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeDialog();
        }
      }}
      open
    >
      <button
        aria-label="Close link dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/30"
        onClick={closeDialog}
        type="button"
      />
      <section
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="document"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold" id="link-dialog-title">
              <Link2 aria-hidden="true" className="size-5 text-primary" />
              {initialHref ? "Edit link" : "Add link"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" id="link-dialog-description">
              Add a destination to the selected text.
            </p>
          </div>
          <Button
            aria-label="Close link dialog"
            onClick={closeDialog}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submitLink}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="document-link-url">
              URL
            </label>
            <input
              aria-describedby={error ? "link-url-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="url"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="document-link-url"
              inputMode="url"
              onChange={(event) => {
                setHref(event.target.value);
                setError(null);
              }}
              placeholder="https://example.com"
              ref={inputRef}
              value={href}
            />
            {error ? (
              <p className="text-xs text-destructive" id="link-url-error">
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {initialHref ? (
              <Button onClick={removeLink} type="button" variant="ghost">
                <Unlink aria-hidden="true" />
                Remove link
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button onClick={closeDialog} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                <Link2 aria-hidden="true" />
                {initialHref ? "Update link" : "Add link"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </dialog>
  );
}
