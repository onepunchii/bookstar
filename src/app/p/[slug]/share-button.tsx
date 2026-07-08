"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    // 모바일은 네이티브 공유 시트, 그 외엔 클립보드 복사
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* 사용자가 취소 → 복사 폴백 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 무시 */
    }
  };
  return (
    <button
      onClick={share}
      aria-label="공유"
      className="flex h-10 flex-1 items-center justify-center rounded-lg text-white/60 ring-1 ring-white/15 transition-colors hover:text-white hover:ring-white/40"
    >
      {copied ? (
        <Check className="h-4 w-4 text-brand-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
