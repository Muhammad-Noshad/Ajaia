import type { RichTextContent } from "@/features/documents/document.schema";

// This is the transport-safe shape shared by server services and client UI.
// It contains no Mongoose document methods or database-specific objects.
export type DocumentView = {
  id: string;
  title: string;
  content: RichTextContent;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
};
