import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import type {
  RichTextContent,
  UpdateDocumentInput,
} from "@/features/documents/document.schema";
import type { DocumentView } from "@/features/documents/document.types";
import { firestore } from "@/lib/firestore";

type FirestoreDocument = {
  title: string;
  content: RichTextContent;
  ownerId: string;
  sharedWith: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const documents = firestore.collection("documents");

function timestampToDate(value: Timestamp | Date | undefined): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return value instanceof Date ? value : new Date(0);
}

/** Converts a Firestore snapshot into the server-neutral document shape. */
function serializeSnapshot(snapshot: DocumentSnapshot): DocumentView | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as FirestoreDocument;

  return {
    id: snapshot.id,
    title: data.title,
    content: data.content,
    ownerId: data.ownerId,
    sharedWith: data.sharedWith ?? [],
    createdAt: timestampToDate(data.createdAt).toISOString(),
    updatedAt: timestampToDate(data.updatedAt).toISOString(),
  };
}

/** Lists owned and shared documents, merging two simple Firestore queries. */
export async function listStoredDocuments(userId: string): Promise<DocumentView[]> {
  const [owned, shared] = await Promise.all([
    documents.where("ownerId", "==", userId).get(),
    documents.where("sharedWith", "array-contains", userId).get(),
  ]);

  const uniqueSnapshots = new Map(
    [...owned.docs, ...shared.docs].map((snapshot) => [snapshot.id, snapshot]),
  );

  return [...uniqueSnapshots.values()]
    .map(serializeSnapshot)
    .filter((document): document is DocumentView => document !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

/** Creates a document with server-owned timestamps and an empty share list. */
export async function createStoredDocument(
  input: { title: string; content: RichTextContent; ownerId: string },
): Promise<DocumentView> {
  const now = Timestamp.now();
  const reference = await documents.add({
    title: input.title,
    content: input.content,
    ownerId: input.ownerId,
    sharedWith: [],
    createdAt: now,
    updatedAt: now,
  });
  const created = serializeSnapshot(await reference.get());

  if (!created) {
    throw new Error("Firestore did not return the created document");
  }

  return created;
}

/** Reads one document by its Firestore document ID. */
export async function getStoredDocument(
  documentId: string,
): Promise<DocumentView | null> {
  return serializeSnapshot(await documents.doc(documentId).get());
}

/** Updates editable fields and advances the server timestamp atomically. */
export async function updateStoredDocument(
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentView | null> {
  const reference = documents.doc(documentId);
  await reference.update({
    title: input.title,
    content: input.content,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeSnapshot(await reference.get());
}

/** Adds a share entry with arrayUnion so repeated shares remain idempotent. */
export async function addStoredDocumentShare(
  documentId: string,
  targetUserId: string,
): Promise<DocumentView | null> {
  const reference = documents.doc(documentId);
  await reference.update({
    sharedWith: FieldValue.arrayUnion(targetUserId),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeSnapshot(await reference.get());
}
