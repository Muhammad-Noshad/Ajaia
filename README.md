# Ajaia Assessment Starter

Lightweight full-stack starter for the Ajaia timed assessment. The repository
contains infrastructure and conventions only; assessment-specific behavior
should be added when the requirements are known.

## Stack

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn/ui (Base UI/Nova preset) and Lucide React
- React Hook Form, Zod, and `@hookform/resolvers`
- Mongoose/MongoDB and Sonner notifications

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `MONGODB_URI` in `.env.local` to a reachable MongoDB instance. The
environment is validated when database infrastructure is used; no database is
needed just to render the initial starter page.

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```powershell
npm run dev       # Start local development
npm run lint      # Check ESLint
npm run build     # Verify the production build
npm run start     # Serve a completed production build
```

## Architecture

Routing lives under `src/app`. Domain behavior belongs under
`src/features/<feature>` and should follow this path when needed:

```text
Route Handler / Server Action → Service → Mongoose Model → MongoDB
```

Shared visual primitives live in `src/components/ui`, application-wide layout
components in `src/components/layout`, and cross-cutting server utilities in
`src/lib`. The MongoDB helper in `src/lib/db.ts` caches the connection for
Next.js development reloads.

Additional layers and dependencies should be introduced only when an actual
assessment requirement gives them a clear responsibility.
