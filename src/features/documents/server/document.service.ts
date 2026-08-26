import { ApplicationError } from "@/lib/application-error";
import type {
  CommentView,
  DocumentVersionView,
  DocumentView,
} from "@/features/documents/document.types";
import {
  createCommentSchema,
  createDocumentSchema,
  commentIdSchema,
  documentIdSchema,
  importedDocumentSchema,
  shareDocumentSchema,
  updateDocumentSchema,
  versionIdSchema,
  type CreateDocumentInput,
  type CreateCommentInput,
  type RichTextContent,
  type ShareDocumentInput,
  type UpdateDocumentInput,
} from "@/features/documents/document.schema";
import {
  canAccessDocument,
  canDeleteDocument,
  canEditDocument,
  canManageSharing,
} from "@/features/documents/server/document-access";
import {
  addStoredDocumentShare,
  createStoredDocumentComment,
  createStoredDocument,
  deleteStoredDocumentComment,
  deleteStoredDocument,
  getStoredDocument,
  getStoredDocumentComment,
  listStoredDocumentComments,
  listStoredDocumentVersions,
  listStoredDocuments,
  restoreStoredDocumentVersion,
  updateStoredDocument,
} from "@/features/documents/server/document.store";
import { getDemoUser } from "@/features/session/demo-users";

function parseDocumentId(documentId: string): string {
  documentIdSchema.parse(documentId);
  return documentId;
}

function textToRichText(text: string): RichTextContent {
  return {
    type: "doc",
    content: text.split(/\r?\n/).map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

/** Lists documents the current demo user owns or has been granted access to. */
export async function listDocuments(userId: string): Promise<DocumentView[]> {
  return listStoredDocuments(userId);
}

/** Creates a persisted blank or imported document for the current user. */
export async function createDocument(
  userId: string,
  input: CreateDocumentInput,
): Promise<DocumentView> {
  const parsedInput = createDocumentSchema.parse(input);
  return createStoredDocument({
    title: parsedInput.title,
    // The recursive Zod schema validates this tree at runtime, while the
    // transport type preserves the richer Tiptap JSON shape for TypeScript.
    content: parsedInput.content as RichTextContent,
    ownerId: userId,
  });
}

/** Returns a document only when the current user has access to it. */
export async function getDocument(
  userId: string,
  documentId: string,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document || !canAccessDocument(document, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return document;
}

/** Saves title/content for an owned or shared document. */
export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const parsedInput = updateDocumentSchema.parse(input);
  const existing = await getStoredDocument(parsedDocumentId);

  if (!existing) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  if (!canEditDocument(existing, userId)) {
    throw new ApplicationError(
      "FORBIDDEN",
      "This document is view-only for your account",
    );
  }

  const document = await updateStoredDocument(
    parsedDocumentId,
    parsedInput,
    userId,
  );

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return document;
}

/** Deletes a document only when the current demo user is its owner. */
export async function deleteDocument(
  userId: string,
  documentId: string,
): Promise<void> {
  const parsedDocumentId = parseDocumentId(documentId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  if (!canDeleteDocument(document, userId)) {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the document owner can delete this document",
    );
  }

  await deleteStoredDocument(parsedDocumentId);
}

/** Lists history only for users who can already access the document. */
export async function listDocumentVersions(
  userId: string,
  documentId: string,
): Promise<DocumentVersionView[]> {
  const parsedDocumentId = parseDocumentId(documentId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document || !canAccessDocument(document, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return listStoredDocumentVersions(parsedDocumentId);
}

/** Lists comments for every user who can view the document. */
export async function listDocumentComments(
  userId: string,
  documentId: string,
): Promise<CommentView[]> {
  const parsedDocumentId = parseDocumentId(documentId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document || !canAccessDocument(document, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return listStoredDocumentComments(parsedDocumentId);
}

/** Creates a comment for any user with document access, including viewers. */
export async function createDocumentComment(
  userId: string,
  documentId: string,
  input: CreateCommentInput,
): Promise<CommentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const parsedInput = createCommentSchema.parse(input);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document || !canAccessDocument(document, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return createStoredDocumentComment(parsedDocumentId, {
    ...parsedInput,
    authorId: userId,
  });
}

/** Allows comment authors and owners to remove comments. */
export async function deleteDocumentComment(
  userId: string,
  documentId: string,
  commentId: string,
): Promise<void> {
  const parsedDocumentId = parseDocumentId(documentId);
  const parsedCommentId = commentIdSchema.parse(commentId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document || !canAccessDocument(document, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  const comment = await getStoredDocumentComment(
    parsedDocumentId,
    parsedCommentId,
  );

  if (!comment) {
    throw new ApplicationError("NOT_FOUND", "Comment not found");
  }

  if (comment.authorId !== userId && document.ownerId !== userId) {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the comment author or document owner can delete this comment",
    );
  }

  await deleteStoredDocumentComment(parsedDocumentId, parsedCommentId);
}

/** Restores a version only for owners and editors because it changes content. */
export async function restoreDocumentVersion(
  userId: string,
  documentId: string,
  versionId: string,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const parsedVersionId = versionIdSchema.parse(versionId);
  const document = await getStoredDocument(parsedDocumentId);

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  if (!canEditDocument(document, userId)) {
    throw new ApplicationError(
      "FORBIDDEN",
      "This document is view-only for your account",
    );
  }

  const restoredDocument = await restoreStoredDocumentVersion(
    parsedDocumentId,
    parsedVersionId,
    userId,
  );

  if (!restoredDocument) {
    throw new ApplicationError("NOT_FOUND", "Document version not found");
  }

  return restoredDocument;
}

/** Imports text as structured paragraphs so the result is immediately editable. */
export async function importTextDocument(
  userId: string,
  input: { title: string; text: string },
): Promise<DocumentView> {
  const parsedInput = importedDocumentSchema.parse(input);

  return createDocument(userId, {
    title: parsedInput.title,
    content: textToRichText(parsedInput.text),
  });
}

/** Grants another known demo user access without duplicating share entries. */
export async function shareDocument(
  userId: string,
  documentId: string,
  input: ShareDocumentInput,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const { userId: targetUserId, role } = shareDocumentSchema.parse(input);

  if (!getDemoUser(targetUserId)) {
    throw new ApplicationError("INVALID_INPUT", "Unknown demo user");
  }

  const document = await getStoredDocument(parsedDocumentId);

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  if (!canManageSharing(document, userId)) {
    throw new ApplicationError(
      "FORBIDDEN",
      "Only the document owner can manage sharing",
    );
  }

  if (targetUserId === document.ownerId) {
    throw new ApplicationError(
      "INVALID_INPUT",
      "The owner already has access to this document",
    );
  }

  const updatedDocument = await addStoredDocumentShare(
    parsedDocumentId,
    targetUserId,
    role,
  );

  if (!updatedDocument) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return updatedDocument;
}
