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

## Representative workflow prompts

- Extract the assessment requirements and separate must-have functionality from
  optional stretch work.
- Design and implement the document editor, Firestore persistence, sharing
  permissions, import flow, history, comments, and exports incrementally.
- Audit responsive behavior and verify the final implementation against the
  assessment checklist.

## Final verification status

Local tests, lint, TypeScript, and the production build pass. The live Vercel
URL responds successfully and serves the Ajaia Docs metadata. A complete
deployed reviewer-flow smoke test, walkthrough video, and final submission
folder remain external delivery tasks rather than code changes.
