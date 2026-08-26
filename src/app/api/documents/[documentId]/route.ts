import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import {
  deleteDocument,
  getDocument,
  updateDocument,
} from "@/features/documents/server/document.service";

type DocumentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(
  _request: Request,
  { params }: DocumentRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const document = await getDocument(user.id, documentId);

    return Response.json({ document });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: DocumentRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    const body = await request.json();
    const document = await updateDocument(user.id, documentId, body);

    return Response.json({ document });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: DocumentRouteContext,
) {
  try {
    const user = await getCurrentDemoUser();
    const { documentId } = await params;
    await deleteDocument(user.id, documentId);

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
