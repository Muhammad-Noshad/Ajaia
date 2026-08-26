import { model, models, Schema, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    // Tiptap JSON is kept as structured data so formatting survives a reload.
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    sharedWith: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

documentSchema.index({ ownerId: 1, updatedAt: -1 });
documentSchema.index({ sharedWith: 1, updatedAt: -1 });

export type DocumentRecord = InferSchemaType<typeof documentSchema>;

// Reuse the registered model during Next.js development reloads instead of
// asking Mongoose to compile the same schema repeatedly.
export const DocumentModel =
  models.Document ?? model("Document", documentSchema);
