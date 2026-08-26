import Link from "next/link";

// Keeps missing routes useful and consistent without coupling them to a feature.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Link className="text-sm font-medium underline underline-offset-4" href="/">
        Return home
      </Link>
    </main>
  );
}
