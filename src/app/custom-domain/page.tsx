import Link from "next/link";

export default function CustomDomainPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          Custom Domain Connected
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Intent Host Links
        </h1>
        <p className="text-sm text-muted-foreground">
          This domain is connected to Intent Host Links. Short links created under this domain will automatically redirect to their destinations.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
