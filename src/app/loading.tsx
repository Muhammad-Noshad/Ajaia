// Provides a shared route-transition fallback while a Server Component tree loads.
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center px-6"
    >
      <p className="text-sm text-muted-foreground">Loading…</p>
    </main>
  );
}
