# Submission Manifest

Update the placeholders below before submitting the assessment.

## Included

- [x] Source code
- [x] `README.md` with local setup and run instructions
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/AI_WORKFLOW.md`
- [x] `SUBMISSION.md`
- [ ] Live product URL: `TODO`
- [ ] Public walkthrough video URL: `TODO`
- [ ] `WALKTHROUGH_URL.txt` updated with the final URL
- [ ] Google Drive folder link: `TODO`
- [ ] Screenshots or demo GIF, if reviewer setup needs them

## Reviewer access

The application uses mocked demo users rather than passwords:

- Alice Morgan (`alice`) - default user and document owner
- Bob Chen (`bob`)
- Casey Patel (`casey`)

Use the user switcher in the workspace header to demonstrate shared access.
Shared users can edit documents; only owners can grant access.

## Supported file import

The product accepts `.txt` and `.md` files up to 1 MB. Each file becomes a new
editable document; the original binary is not stored.

## Current limitations

- Demo identity is not production authentication.
- Editing is persisted but not simultaneous real-time collaboration.
- Imported Markdown is treated as text paragraphs rather than parsed into rich
  Markdown formatting.
- PDF export opens the browser print dialog; reviewers should choose “Save as
  PDF” to download the document.

## Final verification checklist

- [ ] Local create/edit/save/reload flow
- [ ] Rich formatting survives reload
- [ ] Import success and invalid-file errors
- [ ] Alice shares with Bob and Bob sees Shared
- [ ] Bob cannot access an unshared document
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Deployed smoke test
- [ ] README, architecture, AI note, video, and links are complete
