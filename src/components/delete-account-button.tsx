"use client";

// 계정 삭제 — 로그인 사용자에게만 노출(데모/게스트 자동 숨김). App Store 5.1.1(v).
// 확인 모달에서 "삭제" 입력 후에만 실행 → 전 데이터 영구 삭제 + Apple 토큰 리보크 + 로그아웃.
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useAuthUi } from "@/lib/auth-ui-store";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function DeleteAccountButton({ dark = false }: { dark?: boolean }) {
  const t = useT();
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
        throw new Error(d.error || t("account.delete.failed"));
      }
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("account.delete.failed"));
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
        <Trash2 className="h-4 w-4" /> {t("account.delete.cta")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black text-neutral-900">
              {t("account.delete.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {t("account.delete.descBefore")}{" "}
              <b className="text-neutral-700">{t("account.delete.descBold")}</b>
              {t("account.delete.descAfter")}
            </p>
            <p className="mt-4 text-sm font-semibold text-neutral-700">
              {t("account.delete.confirmPromptBefore")}{" "}
              <span className="text-red-500">{t("account.delete.keyword")}</span>{" "}
              {t("account.delete.confirmPromptAfter")}
            </p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("account.delete.keyword")}
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
                {t("common.cancel")}
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
                {t("account.delete.confirmCta")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
