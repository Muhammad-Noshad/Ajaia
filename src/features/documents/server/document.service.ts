import { ApplicationError } from "@/lib/application-error";
import type { DocumentView } from "@/features/documents/document.types";
import {
  createDocumentSchema,
  documentIdSchema,
  importedDocumentSchema,
  shareDocumentSchema,
  updateDocumentSchema,
  type CreateDocumentInput,
  type RichTextContent,
  type UpdateDocumentInput,
} from "@/features/documents/document.schema";
import {
  canAccessDocument,
  canManageSharing,
} from "@/features/documents/server/document-access";
import {
  addStoredDocumentShare,
  createStoredDocument,
  getStoredDocument,
  listStoredDocuments,
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

  if (!existing || !canAccessDocument(existing, userId)) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  const document = await updateStoredDocument(parsedDocumentId, parsedInput);

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return document;
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
  input: { userId: string },
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const { userId: targetUserId } = shareDocumentSchema.parse(input);

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
  );

  if (!updatedDocument) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return updatedDocument;
}
