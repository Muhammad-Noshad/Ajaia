import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import { listDocumentVersions } from "@/features/documents/server/document.service";

type VersionsRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(
  _request: Request,
  { params }: VersionsRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const versions = await listDocumentVersions(user.id, documentId);

    return Response.json({ versions });
  } catch (error) {
    return errorResponse(error);
  }
}
