# Ajaia Assessment Starter

Lightweight collaborative document editor for the Ajaia timed full-stack
assessment. It focuses on a useful persisted editing flow, practical sharing,
and text/Markdown import without pretending to implement Google Docs in full.

## Stack

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn/ui (Base UI/Nova preset) and Lucide React
- React Hook Form, Zod, and `@hookform/resolvers`
- Firebase Cloud Firestore with Firebase Admin and Sonner notifications
- Tiptap rich-text editing (history, links, headings, lists, blockquotes, code
  blocks, and dividers) and Vitest access-rule tests

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in
`.env.local` using a Firebase service-account key. Create the Firestore database
in Firebase Console before starting the app. The application uses three demo
users selected from the workspace header; this is mocked assessment
authentication, not production auth.

### Firebase credentials

1. Create or open a project at [Firebase Console](https://console.firebase.google.com/).
2. Open **Build -> Firestore Database** and create the database in Native mode.
3. Open **Project settings -> Service accounts**, choose **Generate new private
   key**, and download the JSON file privately.
4. Copy these JSON fields into `.env.local`:

   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

   Keep the private key out of Git. In `.env.local`, preserve its line breaks or
   encode each line break as `\\n`; the server normalizes the encoded form.

The import flow supports `.txt` and `.md` files up to 1 MB. Files are converted
into new editable documents and the original binary is not stored.

Document changes autosave 1.2 seconds after editing stops. The explicit Save
button remains available for immediate persistence and displays the latest save
time or a retry-needed state when saving fails. The editor footer also shows
live word and character counts, and the Outline control provides navigation for
documents with headings. The Export menu downloads Markdown directly or opens a
clean print view for saving the current editor content as PDF. Document owners
can permanently delete their documents after confirmation; shared users cannot.
The History panel shows the 50 most recent saved versions and lets accessible
editors preview formatted content before restoring an earlier state; the
current state is preserved in history after every restore.

Sharing supports two collaborator roles: **Editor** can edit, rename, export,
preview history, and restore versions; **Viewer** can view, export, and preview
history only. Owners alone can share, change roles, and delete documents.

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
Route Handler -> Service -> Firestore store -> Cloud Firestore
```

Shared visual primitives live in `src/components/ui`, application-wide layout
components in `src/components/layout`, and cross-cutting server utilities in
`src/lib`. The Firebase Admin helper in `src/lib/firestore.ts` reuses the
initialized app across Next.js development reloads.

The document editor stores Tiptap JSON, while sharing stores stable demo-user
IDs on each document. Shared users can edit; only owners can grant access.
Additional layers and dependencies should be introduced only when an actual
assessment requirement gives them a clear responsibility.

## Assessment materials

- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [Submission manifest](SUBMISSION.md)
- [Walkthrough URL placeholder](WALKTHROUGH_URL.txt)
