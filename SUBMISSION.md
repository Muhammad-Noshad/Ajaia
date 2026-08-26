# Submission Manifest

This manifest lists the application, reviewer instructions, and remaining
external submission items for Ajaia Docs.

## Included

- [x] Source code
- [x] `README.md` with local setup and run instructions
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/AI_WORKFLOW.md`
- [x] `SUBMISSION.md`
- [x] Live product URL: [https://ajaiadocs-three.vercel.app/](https://ajaiadocs-three.vercel.app/)
- [ ] Public 3-5 minute walkthrough video URL
- [ ] `WALKTHROUGH_URL.txt` updated with the final video URL
- [ ] Google Drive folder link
- [ ] Screenshots or demo GIF, if reviewer setup needs them

The live product is available at the URL above. The video URL and Drive folder
cannot be completed from the codebase and must be added before submission.

## Reviewer access

The application uses mocked demo users rather than passwords:

- Alice Morgan (`alice`) - default user and document owner
- Bob Chen (`bob`)
- Casey Patel (`casey`)

Use the user switcher in the workspace header to demonstrate shared access.
Alice owns the default documents. The owner can share a document with Bob or
Casey as either **Editor** or **Viewer**. Editors can edit, rename, export,
preview history, and restore versions; viewers can view, export, preview
history, and comment. Only owners can share, change roles, or delete.

## Supported file import

The product accepts `.txt` and `.md` files up to 1 MB. Each file becomes a new
editable document; the original binary is not stored.

## Current limitations

- Demo identity is not production authentication.
- Editing is persisted but not simultaneous real-time collaboration.
- Imported Markdown is treated as text paragraphs rather than parsed into rich
  Markdown formatting.
- PDF export opens the browser print dialog; reviewers should choose "Save as
  PDF" to download the document.

## What another 2-4 hours would add

- A compact mobile document switcher for widths below 900px, where the desktop
  sidebar is intentionally hidden.
- A deployed end-to-end reviewer smoke test with documented results.
- A more complete Markdown importer that maps headings and lists to rich text.

## Reviewer walkthrough

1. Open the live URL and begin as Alice.
2. Create or select a document, rename it, format content, and save it.
3. Refresh to demonstrate Firestore persistence.
4. Import a `.txt` or `.md` file and verify it becomes a new document.
5. Share a document with Bob as Viewer, switch to Bob, and verify the shared
   label and read-only editing behavior.
6. Return to Alice to demonstrate comments, history preview/restore, exports,
   and owner-only controls.

## Final verification checklist

- [x] Local create/edit/save/reload flow
- [x] Rich formatting survives reload
- [x] Import success and invalid-file errors
- [x] Alice shares with Bob and Bob sees Shared
- [x] Bob cannot access an unshared document
- [x] `npm run test`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] Deployed smoke test
- [ ] README, architecture, AI note, video, and external links are complete
