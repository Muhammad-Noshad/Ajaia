export type DocumentAccessRecord = {
  ownerId: string;
  sharedWith: string[];
};

export function canAccessDocument(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  return document.ownerId === userId || document.sharedWith.includes(userId);
}

export function canManageSharing(
  document: DocumentAccessRecord,
  userId: string,
): boolean {
  return document.ownerId === userId;
}

export function accessibleDocumentFilter(userId: string) {
  return {
    $or: [{ ownerId: userId }, { sharedWith: userId }],
  };
}
