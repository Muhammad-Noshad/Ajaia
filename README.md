# Ajaia Assessment Starter

Lightweight collaborative document editor for the Ajaia timed full-stack
assessment. It focuses on a useful persisted editing flow, practical sharing,
and text/Markdown import without pretending to implement Google Docs in full.

## Stack

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn/ui (Base UI/Nova preset) and Lucide React
- React Hook Form, Zod, and `@hookform/resolvers`
- Mongoose/MongoDB and Sonner notifications
- Tiptap rich-text editing (history, links, headings, lists, blockquotes, code
  blocks, and dividers) and Vitest access-rule tests

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `MONGODB_URI` in `.env.local` to a reachable local MongoDB or MongoDB Atlas
instance. The application uses three demo users selected from the workspace
header; this is mocked assessment authentication, not production auth.

The import flow supports `.txt` and `.md` files up to 1 MB. Files are converted
into new editable documents and the original binary is not stored.

Document changes autosave 1.2 seconds after editing stops. The explicit Save
button remains available for immediate persistence and displays the latest save
time or a retry-needed state when saving fails. The editor footer also shows
live word and character counts, and the Outline control provides navigation for
documents with headings. The Export menu downloads Markdown directly or opens a
clean print view for saving the current editor content as PDF.

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```powershell
npm run dev       # Start local development
npm run lint      # Check ESLint
npm run test      # Run meaningful automated tests
npm run build     # Verify the production build
npm run start     # Serve a completed production build
```

## Architecture

Routing lives under `src/app`. Document behavior belongs under
`src/features/documents` and follows this path:

```text
Route Handler -> Service -> Mongoose Model -> MongoDB
```

Shared visual primitives live in `src/components/ui`, application-wide layout
components in `src/components/layout`, and cross-cutting server utilities in
`src/lib`. The MongoDB helper in `src/lib/db.ts` caches the connection for
Next.js development reloads.

The document editor stores Tiptap JSON, while sharing stores stable demo-user
IDs on each document. Shared users can edit; only owners can grant access.
Additional layers and dependencies should be introduced only when an actual
assessment requirement gives them a clear responsibility.

## Assessment materials

- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [Submission manifest](SUBMISSION.md)
- [Walkthrough URL placeholder](WALKTHROUGH_URL.txt)
