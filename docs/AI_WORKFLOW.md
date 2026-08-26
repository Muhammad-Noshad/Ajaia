# AI Workflow Note

## Tools used

Codex was used as an engineering assistant for requirement extraction,
architecture planning, implementation, code review, and verification. The
assessment instructions remained authoritative; generated suggestions were
reviewed against them before changes were made.

## Where AI accelerated the work

- Converted the assignment into explicit Must Have, Should Have, Optional, and
  Deferred requirements.
- Identified the first vertical slice and kept sharing/import behind it.
- Generated initial schema, service, API, and UI structure quickly.
- Reviewed Next.js 16 route/cookie conventions from the locally installed docs.
- Suggested focused tests around access logic rather than third-party UI.

## Judgment and changes

- Rejected speculative authentication, realtime, storage, AI, and state-library
  dependencies because the assignment did not require them.
- Removed the separate Tiptap underline package after verifying the installed
  StarterKit already provides underline.
- Simplified React effects after lint identified cascading state updates.
- Moved the transport document type out of the server service so client code has
  a clean feature boundary.
- Removed unused generated Next/Vercel assets and replaced the generic favicon
  with the Ajaia mark.

## Verification

AI-generated code was checked with:

- Vitest access tests
- ESLint
- TypeScript compilation
- Next.js production builds when the development server is stopped
- Live API smoke tests against the configured Cloud Firestore database
- Manual reviewer-flow testing before submission

Before submitting, update this note with any additional AI suggestions that were
changed or rejected, the final deployment smoke-test result, and the specific
prompts that materially influenced the implementation.
