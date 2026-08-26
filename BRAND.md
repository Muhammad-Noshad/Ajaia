# Ajaia Brand Kit

## Direction

**Personality:** calm, precise, optimistic.

**Visual idea:** a warm, human canvas with a focused indigo action color and a
mint accent for moments of progress or emphasis. The system is intentionally
neutral so it can support whatever product domain the assessment reveals.

## Typography

- **Primary:** Manrope Variable, weights 200-800
- **Fallback:** system sans-serif
- **Code/data:** system monospace stack

Manrope is installed locally through `@fontsource-variable/manrope` and loaded
from `src/app/globals.css`; this avoids relying on a network font request during
builds.

## Color tokens

| Role | Token | Use |
| --- | --- | --- |
| Indigo | `--brand-indigo` | Primary actions, focus rings, links |
| Mint | `--brand-mint` | Positive emphasis, selection, progress |
| Ink | `--brand-ink` | Primary text on light surfaces |
| Background | `--background` | Page canvas |
| Muted | `--muted` | Secondary surfaces and controls |
| Destructive | `--destructive` | Errors and irreversible actions |

Components should use semantic shadcn classes such as `bg-primary`,
`text-muted-foreground`, and `border-border` instead of hardcoded colors.

## Mark

The starter mark is available at `public/ajaia-mark.svg`. Keep its rounded
container and clear space when using it. The wordmark should be rendered as
text using Manrope rather than duplicated inside an image.

## Usage rules

- Use indigo for the primary call to action; do not make every element primary.
- Use mint sparingly so it continues to signal progress or positive emphasis.
- Preserve readable contrast in both light and dark modes.
- Add new semantic tokens only when a real component needs them.
