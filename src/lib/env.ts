import { z } from "zod";

// This module is the single boundary for server environment configuration. It
// validates the Firebase Admin credential parts before a request reaches the
// persistence layer, which makes deployment mistakes actionable.
const envSchema = z.object({
  FIREBASE_PROJECT_ID: z
    .string()
    .trim()
    .min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .trim()
    .email("FIREBASE_CLIENT_EMAIL must be a valid service-account email"),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1, "FIREBASE_PRIVATE_KEY is required"),
});

const parsedEnv = envSchema.safeParse({
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
});

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsedEnv.data;
