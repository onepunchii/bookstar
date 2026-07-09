"use client";

// 관리자 소속사 인증 승인/반려 버튼.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

export function AgencyVerifyActions({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (action: "approve" | "reject") => {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("처리에 실패했어요.");
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => act("approve")}
        disabled={!!busy}
        className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
      >
        {busy === "approve" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        승인
      </button>
      <button
        onClick={() => act("reject")}
        disabled={!!busy}
        className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
      >
        {busy === "reject" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        반려
      </button>
    </div>
  );
}
