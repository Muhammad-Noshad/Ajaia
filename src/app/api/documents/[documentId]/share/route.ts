import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import { shareDocument } from "@/features/documents/server/document.service";

type ShareRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(
  request: Request,
  { params }: ShareRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const document = await shareDocument(user.id, documentId, await request.json());

    return Response.json({ document });
  } catch (error) {
    return errorResponse(error);
  }
}
