import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import { restoreDocumentVersion } from "@/features/documents/server/document.service";

type RestoreRouteContext = {
  params: Promise<{ documentId: string; versionId: string }>;
};

export async function POST(
  _request: Request,
  { params }: RestoreRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId, versionId } = await params;
    const document = await restoreDocumentVersion(
      user.id,
      documentId,
      versionId,
    );

    return Response.json({ document });
  } catch (error) {
    return errorResponse(error);
  }
}
