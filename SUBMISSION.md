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
- [x] Public 3-5 minute walkthrough video URL: https://www.loom.com/share/2531b12c98564acea8d7d9d8d0c50c33
- [x] `WALKTHROUGH_URL.txt` updated with the final video URL
- [x] Google Drive source archive: [Download code ZIP](https://drive.google.com/file/d/1CwPLGv9HZY0somZJyghXOe7kgmFwLUgx/view?usp=sharing)

The live product and walkthrough are available at the URLs above. The Google
Drive submission folder link must still be added before submission.

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

## Assessment coverage

### Core requirements

- [x] Create, rename, edit, save, and reopen persisted documents.
- [x] Preserve rich-text structure through Firestore persistence.
- [x] Support bold, italic, underline, headings, and bulleted/numbered lists.
- [x] Import a product-relevant file type with visible type and size limits.
- [x] Demonstrate document ownership, sharing, and owned/shared labels.
- [x] Provide validation, safe errors, loading states, and an automated test.

### Implemented stretch work

- [x] Version history with formatted preview and restore.
- [x] Markdown and PDF export.
- [x] Selected-text comments for owners, editors, and viewers.
- [x] Editor/viewer role-based sharing permissions.
- [x] Responsive editor layout with mobile document navigation.

## Functionality summary

- **Document workspace:** Lists accessible documents and keeps the selected
  document synchronized with the editor.
- **Document creation:** Creates a new editable document with an initial blank
  rich-text structure.
- **Rename and edit:** Lets owners and editors rename documents and modify their
  content directly in the browser.
- **Autosave and explicit save:** Debounces edits for automatic persistence while
  retaining a visible Save action and saved/unsaved feedback.
- **Persistence and reopen:** Stores title, content, ownership, and sharing in
  Firestore so documents survive refreshes.
- **Rich-text formatting:** Supports bold, italic, underline, headings,
  blockquotes, code blocks, links, dividers, and bulleted/numbered lists.
- **Undo and redo:** Uses Tiptap history to reverse and restore editing changes.
- **Outline navigation:** Extracts headings from the live document and scrolls
  to the selected section.
- **Text and Markdown import:** Converts validated `.txt` and `.md` uploads into
  new editable documents with clear type and size errors.
- **Sharing and roles:** Owners can share with demo users as Editor or Viewer;
  server checks enforce each role's allowed actions.
- **Comments:** All accessible roles can comment on selected text, while authors
  and owners can remove comments.
- **Version history:** Saves meaningful snapshots, previews formatted versions,
  and restores an earlier version while preserving the current state in history.
- **Export:** Downloads Markdown or opens a print-ready view for PDF creation.
- **Owner controls:** Owners can manage sharing, change roles, and delete
  documents with confirmation; shared users cannot delete.
- **Responsive navigation:** Keeps editing usable on narrow screens with a
  mobile documents drawer and overlay panels for history, outline, and comments.
- **Demo identity:** Provides Alice, Bob, and Casey accounts through a clearly
  labeled demo-user switcher instead of pretending to provide production auth.
- **Validation and feedback:** Includes safe API errors, loading/empty states,
  unsupported-file feedback, save failure feedback, and word/character counts.

## Supported file import

The product accepts `.txt` and `.md` files up to 1 MB. Each file becomes a new
editable document; the original binary is not stored.

## What is working

The complete local reviewer flow works end to end: document creation, rich-text
editing, save/reopen, text/Markdown import, sharing, role enforcement,
comments, history preview/restore, exports, and owner-only deletion.

## What is intentionally incomplete

- Demo identity is not production authentication.
- Editing is persisted but not simultaneous real-time collaboration.
- Imported Markdown is treated as text paragraphs rather than parsed into rich
  Markdown formatting.
- PDF export opens the browser print dialog; reviewers should choose "Save as
  PDF" to download the document.

## What another 2-4 hours would add

These are the highest-value product improvements after the submitted scope:

- **Production authentication and secure invitations:** replace demo-user
  switching with account sign-in, document invitations, access revocation, and
  server-enforced identity rather than client-selected demo cookies.
- **Structure-preserving Markdown import:** parse headings, lists, links, and
  emphasis into the same Tiptap document model used by the editor instead of
  importing Markdown as plain paragraphs.
- **Comment lifecycle and collaboration signals:** add resolve/reopen and reply
  actions to comments, plus lightweight presence or last-active indicators;
  simultaneous editing would remain a larger follow-up project.
- **Keyboard shortcuts:** add platform-aware shortcuts for save, undo/redo,
  formatting, headings, and links, with shortcut hints in the toolbar.

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
