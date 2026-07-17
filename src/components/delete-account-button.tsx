"use client";

// 계정 삭제 — 로그인 사용자에게만 노출(데모/게스트 자동 숨김). App Store 5.1.1(v).
// 확인 모달에서 "삭제" 입력 후에만 실행 → 전 데이터 영구 삭제 + Apple 토큰 리보크 + 로그아웃.
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useAuthUi } from "@/lib/auth-ui-store";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function DeleteAccountButton({ dark = false }: { dark?: boolean }) {
  const isLoggedIn = useAuthUi((s) => s.isLoggedIn);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) return null;

  const del = async () => {
    if (confirm !== "삭제" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "삭제" }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || "삭제에 실패했어요");
      }
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요");
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    setConfirm("");
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors",
          dark
            ? "text-red-300/60 hover:text-red-300"
            : "text-red-500/70 hover:text-red-600"
        )}
      >
        <Trash2 className="h-4 w-4" /> 계정 삭제
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black text-neutral-900">
              계정을 삭제할까요?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              계정과 모든 데이터(프로필·소속사·아티스트·섭외 요청·협의
              메시지·일정·정산 등)가 <b className="text-neutral-700">영구
              삭제</b>되며 복구할 수 없어요. 계약·결제 기록 등 법령상 보존
              항목은 분리 보관 후 파기됩니다.
            </p>
            <p className="mt-4 text-sm font-semibold text-neutral-700">
              계속하려면 <span className="text-red-500">삭제</span> 를
              입력하세요.
            </p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="삭제"
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 focus:border-red-400 focus:outline-none"
            />
            {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={close}
                disabled={busy}
                className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={del}
                disabled={confirm !== "삭제" || busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
