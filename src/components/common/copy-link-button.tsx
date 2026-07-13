"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Copies a URL to the clipboard with lightweight visual feedback. */
export function CopyLinkButton({
  url,
  label = "Copy link",
  size = "sm",
  variant = "secondary",
}: {
  url: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "secondary" | "outline" | "default";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <Button type="button" onClick={copy} size={size} variant={variant}>
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {label}
    </Button>
  );
}
