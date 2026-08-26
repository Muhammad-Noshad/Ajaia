"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { CommentDialog } from "@/features/documents/components/comment-dialog";
import type {
  CommentView,
  DocumentView,
} from "@/features/documents/document.types";
import { DEMO_USERS } from "@/features/session/demo-users";

type CommentsPanelProps = {
  currentUserId: string;
  document: DocumentView;
  editor: Editor | null;
  onClose: () => void;
};

function formatCommentDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

// Comments are loaded on demand and retain only anchor metadata, so a viewer
// can participate without receiving edit access to the document itself.
export function CommentsPanel({
  currentUserId,
  document,
  editor,
  onClose,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentAnchor, setCommentAnchor] = useState<{
    from: number;
    to: number;
    quote: string;
  } | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetch(`/api/documents/${document.id}/comments`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          comments?: CommentView[];
          error?: string;
        };

        if (!response.ok || !result.comments) {
          throw new Error(result.error ?? "Unable to load comments");
        }

        if (isActive) {
          setComments(result.comments);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load comments",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [document.id]);

  function startComment() {
    if (!editor) {
      return;
    }

    const { from, to } = editor.state.selection;
    const quote = editor.state.doc.textBetween(from, to, " ").trim();

    if (from === to || !quote) {
      toast.error("Select text in the document before adding a comment");
      return;
    }

    setCommentAnchor({ from, to, quote: quote.slice(0, 500) });
  }

  function jumpToComment(comment: CommentView) {
    if (!editor) {
      return;
    }

    const maximumPosition = editor.state.doc.content.size;
    if (comment.from < 1 || comment.to > maximumPosition || comment.from >= comment.to) {
      toast.error("This comment's text has moved; its saved quote is shown below");
      return;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from: comment.from, to: comment.to })
      .scrollIntoView()
      .run();
  }

  async function deleteComment(commentId: string) {
    if (deletingCommentId) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      const response = await fetch(
        `/api/documents/${document.id}/comments/${commentId}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete comment");
      }

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
      toast.success("Comment deleted");
    } catch (deleteError: unknown) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Unable to delete comment",
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  return (
    <>
      <button
        aria-label="Close comments"
        className="absolute inset-0 z-10 bg-foreground/20 md:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm shrink-0 flex-col border-l border-border bg-card shadow-xl md:relative md:z-0 md:shadow-none">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Comments</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading comments…" : `${comments.length} comments`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Add comment to selected text"
              disabled={!editor}
              onClick={startComment}
              size="icon-sm"
              title="Add comment to selected text"
              type="button"
              variant="ghost"
            >
              <MessageSquarePlus aria-hidden="true" />
            </Button>
            <Button
              aria-label="Close comments"
              onClick={onClose}
              size="icon-sm"
              title="Close comments"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Loading comments…
            </div>
          ) : error ? (
            <p className="px-2 py-3 text-sm leading-6 text-destructive">{error}</p>
          ) : comments.length === 0 ? (
            <div className="space-y-3 px-2 py-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Select text and use the comment button to leave feedback.
              </p>
              <Button onClick={startComment} size="sm" type="button" variant="outline">
                <MessageSquarePlus aria-hidden="true" />
                Add comment
              </Button>
            </div>
          ) : (
            <ol className="space-y-3">
              {comments.map((comment) => {
                const author = DEMO_USERS.find((user) => user.id === comment.authorId);
                const canDelete =
                  comment.authorId === currentUserId || document.ownerId === currentUserId;
                const isDeleting = deletingCommentId === comment.id;

                return (
                  <li className="rounded-lg border border-border p-3" key={comment.id}>
                    <button
                      className="block w-full text-left"
                      onClick={() => jumpToComment(comment)}
                      title="Jump to commented text"
                      type="button"
                    >
                      <p className="line-clamp-2 border-l-2 border-brand-indigo pl-3 text-xs italic text-muted-foreground">
                        “{comment.quote}”
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                        {comment.text}
                      </p>
                    </button>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {author?.name ?? "Demo user"} · {formatCommentDate(comment.createdAt)}
                      </p>
                      {canDelete ? (
                        <Button
                          aria-label="Delete comment"
                          disabled={Boolean(deletingCommentId)}
                          onClick={() => void deleteComment(comment.id)}
                          size="icon-sm"
                          title="Delete comment"
                          type="button"
                          variant="ghost"
                        >
                          {isDeleting ? (
                            <Loader2 aria-hidden="true" className="animate-spin" />
                          ) : (
                            <Trash2 aria-hidden="true" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </aside>
      {commentAnchor ? (
        <CommentDialog
          anchor={commentAnchor}
          document={document}
          onClose={() => setCommentAnchor(null)}
          onCreated={(comment) => {
            setComments((current) => [comment, ...current]);
            setCommentAnchor(null);
          }}
        />
      ) : null}
    </>
  );
}
