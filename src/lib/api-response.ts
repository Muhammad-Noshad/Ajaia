import { z } from "zod";

import { ApplicationError } from "@/lib/application-error";

const statusByErrorCode = {
  FORBIDDEN: 403,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
} as const;

/**
 * Converts known validation/application failures into safe JSON responses.
 * Unexpected failures are logged server-side but never expose implementation
 * details or stack traces to the browser.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: "Invalid request",
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (error instanceof ApplicationError) {
    return Response.json(
      { error: error.message },
      { status: statusByErrorCode[error.code] },
    );
  }

  console.error("Unexpected API error", error);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
