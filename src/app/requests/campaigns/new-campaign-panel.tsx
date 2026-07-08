"use client";

// 광고주 오픈 캠페인 만들기 — 필수 최소 + 스마트 기본값(다크).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUDGET_PRESETS,
  EVENT_TYPES,
  defaultDeadline,
} from "@/lib/campaign-options";
import { fileToWebP } from "@/lib/image";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, ImagePlus, Loader2, Plus, X } from "lucide-react";

const CATS = Object.entries(CATEGORY_LABELS) as [string, string][];
const input =
  "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-medium text-white ring-1 ring-white/12 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function NewCampaignPanel({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [cats, setCats] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline(7));
  const [eventDate, setEventDate] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCat = (c: string) =>
    setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));

  const applyPreset = (min: number | null, max: number | null) => {
    setBudgetMin(min != null ? String(min) : "");
    setBudgetMax(max != null ? String(max) : "");
  };
  const activePreset = (min: number | null, max: number | null) =>
    (min != null ? String(min) : "") === budgetMin &&
    (max != null ? String(max) : "") === budgetMax &&
    (budgetMin !== "" || budgetMax !== "");

  const pickImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const webp = await fileToWebP(file);
      const fd = new FormData();
      fd.append("file", webp.blob, webp.fileName);
      const res = await fetch("/api/campaigns/image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 업로드에 실패했어요");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) return setError("캠페인 제목을 입력해주세요");
    if (!deadline) return setError("신청 마감일을 정해주세요");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventType,
          categories: cats,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          deadline,
          eventDate: eventDate || undefined,
          description: desc || undefined,
          imageUrl: imageUrl || undefined,
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

      {/* 예산 — 프리셋으로 빠르게, 또는 직접 입력(만원) */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-white/55">
          예산 범위 <span className="text-white/30">(선택 · 만원 단위)</span>
        </span>
        <div className="mb-2.5 flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => applyPreset(b.min, b.max)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition-colors",
                activePreset(b.min, b.max)
                  ? "bg-brand-500 text-white ring-brand-500"
                  : "bg-white/[0.03] text-white/60 ring-white/12 hover:text-white"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="최소"
              className={cn(input, "pr-12")}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/35">
              만원
            </span>
          </div>
          <span className="text-white/30">~</span>
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="최대"
              className={cn(input, "pr-12")}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/35">
              만원
            </span>
          </div>
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

      {/* 브랜드·레퍼런스 이미지 (선택) */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-white/55">
          브랜드·레퍼런스 이미지 <span className="text-white/30">(선택)</span>
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickImage(f);
            e.target.value = "";
          }}
        />
        {imageUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="레퍼런스"
              className="h-32 w-full max-w-xs rounded-xl object-cover ring-1 ring-white/10"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              aria-label="이미지 삭제"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-sm font-semibold text-white/50 transition-colors hover:border-brand-500/50 hover:text-white disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "업로드 중…" : "이미지 올리기"}
          </button>
        )}
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
        disabled={saving || uploading}
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
