"use client";

// 광고주 오픈 캠페인 만들기 — 필수 최소 + 스마트 기본값(다크).
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUDGET_PRESETS,
  EVENT_TYPES,
  defaultDeadline,
} from "@/lib/campaign-options";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus, X } from "lucide-react";

const CATS = Object.entries(CATEGORY_LABELS) as [string, string][];
const input =
  "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-medium text-white ring-1 ring-white/12 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function NewCampaignPanel({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [cats, setCats] = useState<string[]>([]);
  const [budgetIdx, setBudgetIdx] = useState<number | null>(null);
  const [deadline, setDeadline] = useState(defaultDeadline(7));
  const [eventDate, setEventDate] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCat = (c: string) =>
    setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));

  const submit = async () => {
    if (!title.trim()) return setError("캠페인 제목을 입력해주세요");
    if (!deadline) return setError("신청 마감일을 정해주세요");
    setSaving(true);
    setError(null);
    const preset = budgetIdx != null ? BUDGET_PRESETS[budgetIdx] : null;
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventType,
          categories: cats,
          budgetMin: preset?.min ?? undefined,
          budgetMax: preset?.max ?? undefined,
          deadline,
          eventDate: eventDate || undefined,
          description: desc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      router.push(`/requests/campaigns/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성에 실패했어요");
      setSaving(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="adv-card rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-white">
          로그인하면 캠페인을 올릴 수 있어요
        </p>
        <p className="mt-1 text-xs text-white/45">
          아티스트·기획사가 직접 지원하는 오픈 캐스팅이에요.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          카카오로 시작하기
        </a>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-5 text-sm font-bold text-white/70 transition-colors hover:border-brand-500/50 hover:text-white"
      >
        <Plus className="h-4 w-4" /> 새 오픈 캠페인 만들기
      </button>
    );
  }

  return (
    <div className="adv-card space-y-6 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-base font-black text-white">새 오픈 캠페인</p>
        <button
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="text-white/40 hover:text-white"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-white/55">
          캠페인 제목 <span className="text-brand-400">*</span>
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 신제품 런칭 유튜브 협업 섭외"
          className={input}
        />
      </label>

      <div>
        <span className="mb-2 block text-xs font-semibold text-white/55">
          어떤 걸 찾나요 <span className="text-brand-400">*</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEventType(t)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition-colors",
                eventType === t
                  ? "bg-brand-500 text-white ring-brand-500"
                  : "bg-white/[0.03] text-white/60 ring-white/12 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-white/55">
          원하는 카테고리 <span className="text-white/30">(복수 선택)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {CATS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleCat(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
                cats.includes(key)
                  ? "bg-brand-500/15 text-brand-300 ring-brand-500/50"
                  : "bg-white/[0.03] text-white/55 ring-white/10 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-white/55">
          예산 범위 <span className="text-white/30">(선택)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((b, i) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setBudgetIdx(budgetIdx === i ? null : i)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition-colors",
                budgetIdx === i
                  ? "bg-brand-500 text-white ring-brand-500"
                  : "bg-white/[0.03] text-white/60 ring-white/12 hover:text-white"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            신청 마감일 <span className="text-brand-400">*</span>
          </span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={cn(input, "[color-scheme:dark]")}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            행사·촬영 예정일 <span className="text-white/30">(선택)</span>
          </span>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={cn(input, "[color-scheme:dark]")}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-white/55">
          상세 설명 <span className="text-white/30">(선택)</span>
        </span>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          placeholder="분량·독점 여부·초상권 조건 등 자유롭게 적어주세요"
          className={cn(input, "resize-none")}
        />
      </label>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        캠페인 공개하기
      </button>
    </div>
  );
}
