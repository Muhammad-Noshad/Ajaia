// Defines transport-neutral application failures. Services use these semantic
// codes without depending on HTTP, while Route Handlers decide the response.
export type ApplicationErrorCode =
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
