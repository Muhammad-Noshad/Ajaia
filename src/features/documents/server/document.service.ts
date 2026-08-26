import { Types } from "mongoose";

import { ApplicationError } from "@/lib/application-error";
import { connectDB } from "@/lib/db";
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
  accessibleDocumentFilter,
  canManageSharing,
} from "@/features/documents/server/document-access";
import { DocumentModel } from "@/features/documents/server/document.model";
import { getDemoUser } from "@/features/session/demo-users";

function serializeDocument(document: {
  _id: Types.ObjectId;
  title: string;
  content: unknown;
  ownerId: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}): DocumentView {
  return {
    id: document._id.toString(),
    title: document.title,
    content: document.content as RichTextContent,
    ownerId: document.ownerId,
    sharedWith: document.sharedWith,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

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
  await connectDB();

  const documents = await DocumentModel.find(accessibleDocumentFilter(userId))
    .sort({ updatedAt: -1 })
    .exec();

  return documents.map(serializeDocument);
}

/** Creates a persisted blank or imported document for the current user. */
export async function createDocument(
  userId: string,
  input: CreateDocumentInput,
): Promise<DocumentView> {
  const parsedInput = createDocumentSchema.parse(input);
  await connectDB();

  const document = await DocumentModel.create({
    ...parsedInput,
    ownerId: userId,
  });

  return serializeDocument(document);
}

/** Returns a document only when the current user has access to it. */
export async function getDocument(
  userId: string,
  documentId: string,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  await connectDB();

  const document = await DocumentModel.findOne({
    _id: parsedDocumentId,
    ...accessibleDocumentFilter(userId),
  }).exec();

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return serializeDocument(document);
}

/** Saves title/content for an owned or shared document. */
export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentView> {
  const parsedDocumentId = parseDocumentId(documentId);
  const parsedInput = updateDocumentSchema.parse(input);
  await connectDB();

  const document = await DocumentModel.findOneAndUpdate(
    {
      _id: parsedDocumentId,
      ...accessibleDocumentFilter(userId),
    },
    parsedInput,
    { new: true, runValidators: true },
  ).exec();

  if (!document) {
    throw new ApplicationError("NOT_FOUND", "Document not found");
  }

  return serializeDocument(document);
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

  await connectDB();
  const document = await DocumentModel.findById(parsedDocumentId).exec();

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

  if (!document.sharedWith.includes(targetUserId)) {
    document.sharedWith.push(targetUserId);
    await document.save();
  }

  return serializeDocument(document);
}
