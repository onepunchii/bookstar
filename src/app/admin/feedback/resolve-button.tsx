"use client";

// 관리자 건의 처리 토글 — new ↔ done.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw } from "lucide-react";

export function ResolveButton({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const done = status === "done";

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: done ? "new" : "done" }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("처리에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        done
          ? "flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white/50 hover:bg-white/12 disabled:opacity-50"
          : "flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
      }
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : done ? (
        <RotateCcw className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {done ? "되돌리기" : "처리 완료"}
    </button>
  );
}
