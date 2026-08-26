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
import type {
  DocumentVersionView,
  SharedDocumentRole,
} from "@/features/documents/document.types";
import { firestore } from "@/lib/firestore";

type FirestoreDocument = {
  title: string;
  content: RichTextContent;
  ownerId: string;
  sharedWith: string[];
  sharedRoles?: Record<string, SharedDocumentRole>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type FirestoreVersion = {
  title: string;
  content: RichTextContent;
  createdById: string;
  createdAt: Timestamp;
};

const documents = firestore.collection("documents");

function documentVersions(documentId: string) {
  return documents.doc(documentId).collection("versions");
}

function timestampToDate(value: Timestamp | Date | null | undefined): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return value instanceof Date ? value : new Date(0);
}

function normalizeSharedRoles(
  sharedWith: string[],
  sharedRoles: Record<string, SharedDocumentRole> | undefined,
): Record<string, SharedDocumentRole> {
  return Object.fromEntries(
    sharedWith.map((userId) => [
      userId,
      sharedRoles?.[userId] === "viewer" ? "viewer" : "editor",
    ]),
  );
}

/** Converts a Firestore snapshot into the server-neutral document shape. */
function serializeSnapshot(snapshot: DocumentSnapshot): DocumentView | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as FirestoreDocument;

  const sharedWith = data.sharedWith ?? [];

  return {
    id: snapshot.id,
    title: data.title,
    content: data.content,
    ownerId: data.ownerId,
    sharedWith,
    sharedRoles: normalizeSharedRoles(sharedWith, data.sharedRoles),
    createdAt: timestampToDate(data.createdAt).toISOString(),
    updatedAt: timestampToDate(data.updatedAt).toISOString(),
  };
}

/** Converts a version snapshot without exposing Firestore's Timestamp type. */
function serializeVersion(
  snapshot: DocumentSnapshot,
): DocumentVersionView | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as FirestoreVersion;

  return {
    id: snapshot.id,
    title: data.title,
    content: data.content,
    createdById: data.createdById,
    createdAt: timestampToDate(data.createdAt).toISOString(),
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
  const reference = documents.doc();
  const versionReference = documentVersions(reference.id).doc();
  const now = Timestamp.now();
  const batch = firestore.batch();

  batch.set(reference, {
    title: input.title,
    content: input.content,
    ownerId: input.ownerId,
    sharedWith: [],
    sharedRoles: {},
    createdAt: now,
    updatedAt: now,
  });
  batch.set(versionReference, {
    title: input.title,
    content: input.content,
    createdById: input.ownerId,
    createdAt: now,
  });
  await batch.commit();

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
  changedById: string,
): Promise<DocumentView | null> {
  const reference = documents.doc(documentId);
  const versionReference = documentVersions(documentId).doc();

  return firestore.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);

    if (!currentSnapshot.exists) {
      return null;
    }

    const current = currentSnapshot.data() as FirestoreDocument;
    const contentChanged =
      JSON.stringify(current.content) !== JSON.stringify(input.content);

    // Autosave can submit the same state more than once. Avoid creating a
    // duplicate history entry when neither the title nor content changed.
    if (!contentChanged && current.title === input.title) {
      return serializeSnapshot(currentSnapshot);
    }

    const now = Timestamp.now();
    transaction.set(versionReference, {
      title: input.title,
      content: input.content,
      createdById: changedById,
      createdAt: now,
    });
    transaction.update(reference, {
      title: input.title,
      content: input.content,
      updatedAt: now,
    });

    return {
      id: documentId,
      title: input.title,
      content: input.content as RichTextContent,
      ownerId: current.ownerId,
      sharedWith: current.sharedWith ?? [],
      sharedRoles: normalizeSharedRoles(
        current.sharedWith ?? [],
        current.sharedRoles,
      ),
      createdAt: timestampToDate(current.createdAt).toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  });
}

/** Adds a share entry with arrayUnion so repeated shares remain idempotent. */
export async function addStoredDocumentShare(
  documentId: string,
  targetUserId: string,
  role: SharedDocumentRole,
): Promise<DocumentView | null> {
  const reference = documents.doc(documentId);
  await reference.update({
    sharedWith: FieldValue.arrayUnion(targetUserId),
    // Demo IDs are validated by the service, so they are safe Firestore map
    // keys. This update changes only the selected user's role atomically.
    [`sharedRoles.${targetUserId}`]: role,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeSnapshot(await reference.get());
}

/** Lists the newest saved states for the document, capped for a fast panel. */
export async function listStoredDocumentVersions(
  documentId: string,
): Promise<DocumentVersionView[]> {
  const snapshot = await documentVersions(documentId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs
    .map(serializeVersion)
    .filter((version): version is DocumentVersionView => version !== null);
}

/** Restores a version and records that restoration as a new version. */
export async function restoreStoredDocumentVersion(
  documentId: string,
  versionId: string,
  restoredById: string,
): Promise<DocumentView | null> {
  const reference = documents.doc(documentId);
  const versionReference = documentVersions(documentId).doc(versionId);
  const newVersionReference = documentVersions(documentId).doc();

  return firestore.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);
    const versionSnapshot = await transaction.get(versionReference);

    if (!currentSnapshot.exists || !versionSnapshot.exists) {
      return null;
    }

    const current = currentSnapshot.data() as FirestoreDocument;
    const version = versionSnapshot.data() as FirestoreVersion;
    const now = Timestamp.now();

    transaction.set(newVersionReference, {
      title: version.title,
      content: version.content,
      createdById: restoredById,
      createdAt: now,
    });
    transaction.update(reference, {
      title: version.title,
      content: version.content,
      updatedAt: now,
    });

    return {
      id: documentId,
      title: version.title,
      content: version.content,
      ownerId: current.ownerId,
      sharedWith: current.sharedWith ?? [],
      sharedRoles: normalizeSharedRoles(
        current.sharedWith ?? [],
        current.sharedRoles,
      ),
      createdAt: timestampToDate(current.createdAt).toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  });
}

/** Deletes a document and its version subcollection in safe batch sizes. */
export async function deleteStoredDocument(documentId: string): Promise<void> {
  const versionSnapshot = await documentVersions(documentId).get();
  const references = [
    ...versionSnapshot.docs.map((snapshot) => snapshot.ref),
    documents.doc(documentId),
  ];

  for (let index = 0; index < references.length; index += 450) {
    const batch = firestore.batch();
    references.slice(index, index + 450).forEach((reference) => {
      batch.delete(reference);
    });
    await batch.commit();
  }
}
