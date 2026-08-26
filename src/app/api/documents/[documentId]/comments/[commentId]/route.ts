import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import { deleteDocumentComment } from "@/features/documents/server/document.service";

type CommentRouteContext = {
  params: Promise<{ documentId: string; commentId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: CommentRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId, commentId } = await params;
    await deleteDocumentComment(user.id, documentId, commentId);

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
