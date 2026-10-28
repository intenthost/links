"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SOCIAL_PLATFORMS, SocialPlatformInfo } from "@/lib/social-platforms";

interface SocialTrackingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  slug: string;
}

export default function SocialTrackingDialog({
  isOpen,
  onOpenChange,
  domain,
  slug,
}: SocialTrackingDialogProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getTrackingUrl = (code: string) => {
    // Format: https://domain/slug?=code
    return `https://${domain}/${slug}?=${code}`;
  };

  const handleCopy = async (code: string, name: string) => {
    const url = getTrackingUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      toast.success(`${name} tracking link copied!`);
      setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const platforms = Object.values(SOCIAL_PLATFORMS);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <Share2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Social Media Tracking
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Share platform-specific links to automatically track clicks and referral sources.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-3 max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
          {platforms.map((platform: SocialPlatformInfo) => {
            const trackingUrl = getTrackingUrl(platform.code);
            const isCopied = copiedCode === platform.code;

            return (
              <div
                key={platform.code}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 transition-colors hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.name}
                    </span>
                    <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      ?={platform.code}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {trackingUrl}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => handleCopy(platform.code, platform.name)}
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-zinc-600 dark:text-zinc-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
