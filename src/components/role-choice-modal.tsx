"use client";

// 최초 로그인 후 역할 2택 — 광고주로 계속 / 소속사(→인증 셋업).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUi } from "@/lib/auth-ui-store";
import { cn } from "@/lib/utils";
import { Building2, Loader2, Search } from "lucide-react";

export function RoleChoiceModal() {
  const { roleOpen, closeRole } = useAuthUi();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (!roleOpen) return null;

  const choose = async (role: "company" | "agency") => {
    setBusy(role);
    try {
      await fetch("/api/onboarding/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    } catch {
      /* 저장 실패해도 진행 — 다음 로그인에 재노출 */
    }
    closeRole();
    if (role === "agency") router.push("/agency/verify");
    else router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-center text-xl font-black text-neutral-900">
          무엇으로 시작할까요?
        </h2>
        <p className="mt-1.5 text-center text-sm text-neutral-500">
          언제든 헤더에서 바꿀 수 있어요.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => choose("company")}
            disabled={!!busy}
            className={cn(
              "flex w-full items-center gap-4 rounded-2xl border-2 border-brand-500 bg-brand-50 p-5 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
              {busy === "company" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-base font-black text-neutral-900">
                섭외하러 왔어요 · 광고주
              </p>
              <p className="text-xs text-neutral-500">
                아티스트를 찾아 섭외 요청 — 바로 시작
              </p>
            </div>
          </button>

          <button
            onClick={() => choose("agency")}
            disabled={!!busy}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-900 disabled:opacity-60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              {busy === "agency" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-base font-black text-neutral-900">
                아티스트를 관리해요 · 소속사
              </p>
              <p className="text-xs text-neutral-500">
                인증 후 로스터·일정·정산 콘솔 — 서류 첨부 필요
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
