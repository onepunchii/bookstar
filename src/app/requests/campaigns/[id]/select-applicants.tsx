"use client";

// 광고주 지원자 목록 + 선정 → 부킹 전환(다크).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Applicant } from "@/lib/data/campaigns";
import { CATEGORY_LABELS, formatBudget, formatFollowers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeCheck, Check, Loader2, Sparkles, Users } from "lucide-react";

export function SelectApplicants({
  campaignId,
  applicants,
  awarded,
}: {
  campaignId: string;
  applicants: Applicant[];
  awarded: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const select = async (applicationId: string) => {
    setBusy(applicationId);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "선정 실패");
      if (data.requestId) router.push(`/requests/${data.requestId}`);
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "선정에 실패했어요");
      setBusy(null);
    }
  };

  if (applicants.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 py-10 text-center text-sm text-white/35">
        아직 지원자가 없어요. 마감 전까지 아티스트·기획사의 지원을 기다려요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm font-medium text-red-400">{error}</p>}
      {applicants.map((a) => {
        const selected = a.status === "selected";
        const rejected = a.status === "rejected";
        return (
          <div
            key={a.id}
            className={cn(
              "adv-card rounded-2xl p-5 transition-opacity",
              rejected && "opacity-45"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                {a.artistImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.artistImage}
                    alt={a.artistName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-white/30">
                    {a.artistName.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{a.artistName}</span>
                  {selected && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      <BadgeCheck className="h-3 w-3" /> 선정됨
                    </span>
                  )}
                  {a.recommended && !selected && !rejected && (
                    <span className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-bold text-brand-300">
                      <Sparkles className="h-3 w-3" /> 적합 1순위
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                  {a.agencyName && <span>{a.agencyName}</span>}
                  {a.categories.length > 0 && (
                    <span>
                      {a.categories
                        .map(
                          (c) =>
                            CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ??
                            c
                        )
                        .join(", ")}
                    </span>
                  )}
                  {a.followers > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {formatFollowers(a.followers)}
                    </span>
                  )}
                </div>
                {a.pitch && (
                  <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                    {a.pitch}
                  </p>
                )}
                {a.proposedFee != null && (
                  <p className="mt-2 text-sm font-bold text-white">
                    제안 견적 {formatBudget(a.proposedFee)}
                    {a.proposedIncludes && (
                      <span className="ml-1.5 text-xs font-normal text-white/45">
                        · {a.proposedIncludes}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {!awarded && (
              <button
                onClick={() => select(a.id)}
                disabled={!!busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === a.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                이 아티스트 선정하고 협의 시작
              </button>
            )}
            {selected && a.requestId && (
              <a
                href={`/requests/${a.requestId}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white/8 px-5 py-3 text-sm font-bold text-white hover:bg-white/12"
              >
                협의 스레드로 이동
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
