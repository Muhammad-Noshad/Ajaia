import { z } from "zod";
import type { JSONContent } from "@tiptap/core";

const richTextMarkSchema = z
  .object({
    type: z.string().trim().min(1),
    attrs: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

// Tiptap emits a recursive JSON tree. Keeping the schema permissive for node
// attributes lets the editor evolve without rewriting the persistence boundary.
const richTextNodeSchema: z.ZodType = z.lazy(() =>
  z
    .object({
      type: z.string().trim().min(1),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: z.array(richTextNodeSchema).optional(),
      marks: z.array(richTextMarkSchema).optional(),
      text: z.string().optional(),
    })
    .passthrough(),
);

export const richTextContentSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(richTextNodeSchema),
  })
  .passthrough();

export const emptyDocumentContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const;

export const documentTitleSchema = z.string().trim().min(1).max(120);

export const documentIdSchema = z
  .string()
  .trim()
  .min(1, "Invalid document id")
  .max(150, "Invalid document id");

export const versionIdSchema = documentIdSchema;

export const createDocumentSchema = z.object({
  title: documentTitleSchema,
  content: richTextContentSchema,
});

export const updateDocumentSchema = createDocumentSchema;

export const shareDocumentSchema = z.object({
  userId: z.string().trim().min(1),
});

export const importedDocumentSchema = z.object({
  title: documentTitleSchema,
  text: z.string().trim().min(1).max(1_000_000),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type RichTextContent = JSONContent & {
  type: "doc";
  content: JSONContent[];
};
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
