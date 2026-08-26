import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import {
  createDocumentComment,
  listDocumentComments,
} from "@/features/documents/server/document.service";

type CommentsRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(
  _request: Request,
  { params }: CommentsRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const comments = await listDocumentComments(user.id, documentId);

    return Response.json({ comments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: CommentsRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const body = await request.json();
    const comment = await createDocumentComment(user.id, documentId, body);

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
