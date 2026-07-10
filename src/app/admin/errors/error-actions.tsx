"use client";

// 에러 처리 — 해결 / 무시 / 되돌리기 / 삭제.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Loader2, RotateCcw, Trash2 } from "lucide-react";

export function ErrorActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const open = status === "open";

  const call = async (init: RequestInit) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/errors/${id}`, init);
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("처리에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (next: string) =>
    call({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

  const remove = () => {
    if (!confirm("이 에러 기록을 삭제할까요? 재발하면 다시 수집됩니다."))
      return;
    call({ method: "DELETE" });
  };

  const base =
    "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold disabled:opacity-50";

  return (
    <div className="flex items-center gap-1.5">
      {busy && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
      {open ? (
        <>
          <button
            onClick={() => setStatus("resolved")}
            disabled={busy}
            className={`${base} bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25`}
          >
            <Check className="h-3 w-3" />
            해결
          </button>
          <button
            onClick={() => setStatus("ignored")}
            disabled={busy}
            className={`${base} bg-white/8 text-white/50 hover:bg-white/12`}
          >
            <EyeOff className="h-3 w-3" />
            무시
          </button>
        </>
      ) : (
        <button
          onClick={() => setStatus("open")}
          disabled={busy}
          className={`${base} bg-white/8 text-white/50 hover:bg-white/12`}
        >
          <RotateCcw className="h-3 w-3" />
          되돌리기
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        className={`${base} text-white/30 hover:bg-red-500/15 hover:text-red-300`}
        aria-label="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
