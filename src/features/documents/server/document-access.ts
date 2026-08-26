import type {
  DocumentRole,
  SharedDocumentRole,
} from "@/features/documents/document.types";

export type DocumentAccessRecord = {
  ownerId: string;
  sharedWith: string[];
  sharedRoles?: Record<string, SharedDocumentRole>;
};

export function canAccessDocument(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  return document.ownerId === userId || document.sharedWith.includes(userId);
}

export function getDocumentRole(
  document: DocumentAccessRecord,
  userId: string,
): DocumentRole | null {
  if (document.ownerId === userId) {
    return "owner";
  }

  if (!document.sharedWith.includes(userId)) {
    return null;
  }

  // Documents created before role support remain editable for existing
  // collaborators instead of silently changing their established access.
  return document.sharedRoles?.[userId] ?? "editor";
}

export function canEditDocument(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  const role = getDocumentRole(document, userId);
  return role === "owner" || role === "editor";
}

export function canManageSharing(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  return document.ownerId === userId;
}

export function canDeleteDocument(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  return document.ownerId === userId;
}
