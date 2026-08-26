import type { RichTextContent } from "@/features/documents/document.schema";

// This is the transport-safe shape shared by server services and client UI.
// It contains no Firestore snapshots, timestamps, or other server objects.
export type DocumentView = {
  id: string;
  title: string;
  content: RichTextContent;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersionView = {
  id: string;
  title: string;
  content: RichTextContent;
  createdById: string;
  createdAt: string;
};
