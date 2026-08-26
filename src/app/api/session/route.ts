import { z } from "zod";

import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser, setCurrentDemoUser } from "@/features/session/server/session";

const sessionSchema = z.object({ userId: z.string().trim().min(1) });

export async function GET() {
  try {
    return Response.json({ currentUser: await getCurrentDemoUser() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = sessionSchema.parse(await request.json());
    const currentUser = await setCurrentDemoUser(body.userId);

    return Response.json({ currentUser });
  } catch (error) {
    return errorResponse(error);
  }
}
