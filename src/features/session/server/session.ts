import { cookies } from "next/headers";

import { ApplicationError } from "@/lib/application-error";
import {
  DEFAULT_DEMO_USER_ID,
  getDemoUser,
  type DemoUser,
} from "@/features/session/demo-users";

export const DEMO_USER_COOKIE = "ajaia-demo-user";

/**
 * Resolves the request identity used by the assessment demo. Invalid or absent
 * cookies fall back to Alice so a clean browser can use the app immediately.
 */
export async function getCurrentDemoUser(): Promise<DemoUser> {
  const cookieStore = await cookies();
  const user = getDemoUser(cookieStore.get(DEMO_USER_COOKIE)?.value);

  return user ?? getDemoUser(DEFAULT_DEMO_USER_ID)!;
}

/** Changes the demo identity through an HTTP-only cookie for the next request. */
export async function setCurrentDemoUser(userId: string): Promise<DemoUser> {
  const user = getDemoUser(userId);

  if (!user) {
    throw new ApplicationError("INVALID_INPUT", "Unknown demo user");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_USER_COOKIE, user.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return user;
}
