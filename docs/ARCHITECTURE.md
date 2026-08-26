# Architecture Note

## Product slice

Ajaia Docs is a focused document workspace for the assessment. It supports
persisted rich-text documents, text/Markdown import, and demonstrable sharing
between fixed demo users. It intentionally does not implement real-time
co-editing or production authentication.

## Data flow

```text
Client workspace
  -> Route Handler (parse, validate, resolve demo user, format response)
  -> Document service (business rules and access checks)
  -> Mongoose model
  -> MongoDB
```

The browser owns transient editor state, selected-document state, and request
feedback. MongoDB owns persisted title/content/ownership/sharing. A successful
mutation replaces the client record with the server response, so the UI does not
pretend a save succeeded before persistence completes.

## Frontend

- `src/app/page.tsx` is a thin route entry point.
- `DocumentWorkspace` owns document list, selection, loading, and network state.
- `DocumentEditor` owns temporary Tiptap/title state and explicit save feedback.
- `DocumentEditor` debounces autosave by edit version while retaining explicit
  Save for immediate persistence; an older response cannot clear newer changes.
- Tiptap stores the editor document as JSON, preserving required structure. Its
  StarterKit also supplies undo/redo, links, headings, lists, blockquotes, code
  blocks, and horizontal rules without changing the persistence contract.
- `DocumentSidebar` derives Owned/Shared labels from the server-provided owner ID.
- Share and import controls are narrow client components around API calls.

No global client store or server-state library is needed for this scope. The
workspace has a single document list and refreshes the browser after switching
the mocked user.

## Backend

Route Handlers live under `src/app/api`:

| Route | Responsibility |
| --- | --- |
| `GET/POST /api/documents` | List accessible documents and create a document |
| `GET/PUT /api/documents/:id` | Read or save an accessible document |
| `POST /api/documents/:id/share` | Owner-only access grant |
| `POST /api/documents/import` | Validate and import `.txt`/`.md` text |
| `GET/POST /api/session` | Read or set the demo-user cookie |

Services do not know about `Request`, `Response`, or HTTP status codes.
`ApplicationError` carries semantic failures, and `api-response.ts` translates
known failures into safe JSON responses while logging unexpected failures.

## Persistence model

Each document contains:

- `title`: trimmed string, maximum 120 characters
- `content`: Tiptap JSON stored as Mongoose `Mixed`
- `ownerId`: fixed demo-user ID
- `sharedWith`: array of fixed demo-user IDs
- Mongoose `createdAt` and `updatedAt` timestamps

Accessible documents satisfy `ownerId == currentUser` or
`sharedWith` containing `currentUser`. Only the owner can grant access; shared
users can edit because the assignment does not define read-only permissions.

## Important tradeoffs

- Fixed demo users demonstrate sharing without the time and security surface of
  passwords, account recovery, or an external auth provider.
- Importing text into a new document satisfies file handling without binary
  storage, Cloudinary, S3, or DOCX parsing.
- Normal request/response saves are sufficient because realtime collaboration is
  optional; last successful save wins if two users edit concurrently.
- Tiptap is used instead of a custom `contentEditable` editor to make formatting
  behavior reliable within the assessment timebox.
- No repository/controller layer exists because the service and model boundaries
  remain readable at the current complexity.

## Verification

- Vitest covers ownership/shared access predicates and query filtering.
- ESLint and TypeScript are run after each implementation slice.
- Manual verification covers create/edit/save/reload, formatting persistence,
  import validation, sharing, user switching, and unauthorized access.
- Deployment verification must repeat the reviewer flow against Atlas/Vercel.
