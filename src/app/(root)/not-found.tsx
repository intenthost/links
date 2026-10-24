import { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bricolage_Grotesque } from "next/font/google";
import { cn } from "@/lib/utils";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Page Not Found | Intent Host",
  description: "The page you're looking for doesn't exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#e8eaf7]/70 via-[#f6efe2]/60 to-[#f7f2ef]/70 px-4 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/50 bg-white/80 shadow-xl backdrop-blur-sm">
        <FileQuestion className="h-9 w-9 text-zinc-700" strokeWidth={1.5} />
      </div>

      <h1
        className={cn(
          bricolage.className,
          "mt-8 text-center text-7xl font-bold tracking-tight text-zinc-900 md:text-8xl",
        )}
      >
        404
      </h1>
      <h2 className="mt-2 text-center text-xl font-semibold text-zinc-900 md:text-2xl">
        Page not found
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-zinc-600">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-white/80">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    </div>
  );
}
