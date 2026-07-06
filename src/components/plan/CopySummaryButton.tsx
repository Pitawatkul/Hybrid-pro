"use client";

import { useState } from "react";

export function CopySummaryButton({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-11 rounded-lg border border-black/10 text-sm font-medium"
    >
      {copied ? "Copied!" : "Copy summary for Claude"}
    </button>
  );
}
