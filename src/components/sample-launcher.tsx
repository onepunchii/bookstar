"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleStore, type Role } from "@/lib/role-store";
import { ROLE_LABEL, SCENARIOS, type Scenario } from "@/lib/samples";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Sparkles, X } from "lucide-react";

const ROLE_STYLE: Record<Role, string> = {
  company: "bg-brand-500 text-white",
  agency: "bg-neutral-900 text-white",
  artist: "bg-neutral-100 text-neutral-700",
};

const ROLES: Role[] = ["company", "agency", "artist"];

export function SampleLauncher() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const setRole = useRoleStore((s) => s.setRole);

  // 첫 방문 시 살짝 강조 (localStorage로 이후 조용해짐)
  useEffect(() => {
    try {
      const v = localStorage.getItem("bookstar-sample-seen");
      if (!v) setSeen(false);
      if (localStorage.getItem("bookstar-sample-dismissed")) setDismissed(true);
    } catch {}
  }, []);

  // 로그인 화면의 "로그인 없이 둘러보기"(/?demo=1) → 역할 선택 모달 자동 오픈.
  // App Store 심사자가 로그인 없이 3역할 데모에 바로 닿게(2.1(a) 접근성).
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "1"
    ) {
      setDismissed(false);
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("bookstar-sample-dismissed", "1");
    } catch {}
  };

  const pick = (scenario: Scenario) => {
    setRole(scenario.role);
    setOpen(false);
    try {
      localStorage.setItem("bookstar-sample-seen", "1");
      // 둘러보기 신호 — 비로그인도 소속사/아티스트 콘솔을 데모 데이터로 열람(미들웨어·게이트 통과)
      document.cookie = "xong-demo=1; path=/; max-age=86400; SameSite=Lax";
    } catch {}
    setSeen(true);
    router.push(`${scenario.path}?sample=${scenario.id}` as never);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!dismissed && (
        <div
          className={cn(
            "fixed bottom-24 right-4 z-40 flex h-12 items-center rounded-full bg-neutral-900 pl-4 pr-1.5 text-sm font-bold text-white shadow-lg shadow-neutral-900/20 md:bottom-6",
            !seen && "ring-4 ring-brand-500/30"
          )}
        >
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 pr-2 transition-opacity hover:opacity-80"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            {t("sample.floatButton")}
            {!seen && (
              <span className="ml-0.5 h-2 w-2 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={dismiss}
            aria-label={t("sample.dismissFloatButton")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-6">
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {t("sample.modalTitle")}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {t("sample.modalDesc")}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 시나리오 리스트 (역할별 그룹) */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {ROLES.map((role) => {
                const items = SCENARIOS.filter((s) => s.role === role);
                return (
                  <section key={role} className="mb-6 last:mb-0">
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-neutral-500">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px]",
                          ROLE_STYLE[role]
                        )}
                      >
                        {ROLE_LABEL[role]}
                      </span>
                      {role === "company" && t("sample.roleCompanyDesc")}
                      {role === "agency" && t("sample.roleAgencyDesc")}
                      {role === "artist" && t("sample.roleArtistDesc")}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {items.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => pick(s)}
                          className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-900 hover:bg-neutral-50"
                        >
                          <span className="text-2xl leading-none">
                            {s.emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-neutral-900">
                              {s.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                              {s.subtitle}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* 푸터 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-neutral-500">
              <span>
                {t("sample.footerNote")}
              </span>
              <a
                href="/join"
                className="font-bold text-brand-600 hover:text-brand-700"
              >
                {t("sample.joinCta")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
