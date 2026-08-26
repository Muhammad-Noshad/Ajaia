import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <Image src="/ajaia-mark.svg" alt="Ajaia" width={56} height={56} priority />
        <p className="text-sm font-medium text-muted-foreground">
          Ajaia · Full-stack assessment
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Starter ready.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          The application foundation is configured. Add assessment-specific
          features under <code className="font-mono text-sm">src/features</code>{" "}
          when the requirements are available.
        </p>
      </div>
    </main>
  );
}
