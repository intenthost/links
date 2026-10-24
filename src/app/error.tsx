"use client";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-4 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Something went wrong!</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          {error?.message || "We encountered an unexpected error."}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="sm"
          onClick={() => {
            if (reset) {
              reset();
            } else {
              window.location.reload();
            }
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
