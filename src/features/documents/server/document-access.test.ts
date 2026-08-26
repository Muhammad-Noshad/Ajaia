import { describe, expect, it } from "vitest";

import {
  canAccessDocument,
  canDeleteDocument,
  canManageSharing,
} from "@/features/documents/server/document-access";

// These tests protect the permission boundary independently of Firestore or UI
// behavior, so a future refactor cannot accidentally expose private documents.
describe("document access", () => {
  const document = {
    ownerId: "alice",
    sharedWith: ["bob"],
  };

  it("allows the owner and shared users to access a document", () => {
    expect(canAccessDocument(document, "alice")).toBe(true);
    expect(canAccessDocument(document, "bob")).toBe(true);
    expect(canAccessDocument(document, "casey")).toBe(false);
  });

  it("allows only the owner to manage sharing", () => {
    expect(canManageSharing(document, "alice")).toBe(true);
    expect(canManageSharing(document, "bob")).toBe(false);
  });

  it("allows only the owner to delete a document", () => {
    expect(canDeleteDocument(document, "alice")).toBe(true);
    expect(canDeleteDocument(document, "bob")).toBe(false);
  });
});
