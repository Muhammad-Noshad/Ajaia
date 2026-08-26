import { errorResponse } from "@/lib/api-response";
import { getCurrentDemoUser } from "@/features/session/server/session";
import { importTextDocument } from "@/features/documents/server/document.service";

const MAX_IMPORT_BYTES = 1_000_000;
const SUPPORTED_EXTENSIONS = [".txt", ".md"];

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
}

function titleFromFilename(filename: string): string {
  const extension = getExtension(filename);
  const title = extension ? filename.slice(0, -extension.length) : filename;
  return title.trim() || "Imported document";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "A text file is required" }, { status: 400 });
    }

    const extension = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return Response.json(
        { error: "Only .txt and .md files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMPORT_BYTES) {
      return Response.json(
        { error: "Files must be smaller than 1 MB" },
        { status: 413 },
      );
    }

    const user = await getCurrentDemoUser();
    const document = await importTextDocument(user.id, {
      title: titleFromFilename(file.name),
      text: await file.text(),
    });

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
