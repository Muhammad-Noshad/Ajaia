import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { env } from "@/lib/env";

// Firebase Admin is initialized once because Next.js can reload server modules
// during development. Reusing the existing app prevents duplicate credential
// registrations and keeps every request on the same Firestore client.
const firebaseApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Vercel and .env files commonly encode line breaks as the two
      // characters "\\n"; the Admin SDK needs actual newlines.
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

export const firestore = getFirestore(firebaseApp);
