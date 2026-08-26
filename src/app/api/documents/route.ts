import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import {
  createDocument,
  listDocuments,
} from "@/features/documents/server/document.service";

export async function GET() {
  try {
    const user = await getCurrentDemoUser();
    const documents = await listDocuments(user.id);

    return Response.json({ documents, currentUser: user });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentDemoUser();
    const body = await request.json();
    const document = await createDocument(user.id, body);

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
