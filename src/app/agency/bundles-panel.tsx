"use client";

// 소속사 번들 상품 — 실제 생성/삭제. company(기업·MCN, 2팀+) 전용.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgencyBundle } from "@/lib/data/bundles";
import type { Artist } from "@/lib/types";
import { formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Package, Plus, Trash2, X } from "lucide-react";

const EVENT_TYPES = ["행사", "광고", "축제", "팬미팅", "강연", "예능"];

export function BundlesPanel({
  bundles,
  artists,
  agencyType,
}: {
  bundles: AgencyBundle[];
  artists: Artist[];
  agencyType: string;
}) {
  const router = useRouter();
  const canCreate = agencyType === "company" && artists.length >= 2;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyDel, setBusyDel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async () => {
    if (!title.trim()) return setError("세트 이름을 입력해주세요");
    if (picked.length < 2) return setError("아티스트를 2팀 이상 골라주세요");
    setSaving(true);
    setError(null);
    // 구성 아티스트 예산 합으로 세트 예산 범위 자동 계산
    const sel = artists.filter((a) => picked.includes(a.id));
    const min = sel.reduce((s, a) => s + (a.budgetRange?.[0] ?? 0), 0);
    const max = sel.reduce((s, a) => s + (a.budgetRange?.[1] ?? 0), 0);
    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          artistIds: picked,
          eventTypes: events,
          budgetMin: min || undefined,
          budgetMax: max || undefined,
          discountPct: discount ? Number(discount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setOpen(false);
      setTitle("");
      setSubtitle("");
      setPicked([]);
      setEvents([]);
      setDiscount("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성에 실패했어요");
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 번들을 삭제할까요?")) return;
    setBusyDel(id);
    try {
      const res = await fetch(`/api/bundles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제에 실패했어요.");
      setBusyDel(null);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
          <Package className="h-3.5 w-3.5 text-brand-500" /> 번들 상품{" "}
          {bundles.length}개
        </h2>
        {canCreate ? (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {open ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {open ? "닫기" : "새 번들 만들기"}
          </button>
        ) : (
          <Link
            href="/agency/account"
            className="shrink-0 whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-700"
          >
            {agencyType !== "company"
              ? "기업·MCN 전용 → 업그레이드"
              : "아티스트 2팀+ 필요"}
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        아티스트 조합을 세트로 팔면 단건보다 전환율이 높아요
      </p>

      {/* 생성 폼 */}
      {open && (
        <div className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="세트 이름 (예: 여름 페스티벌 세트)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="한 줄 설명 (선택)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div>
            <p className="mb-1.5 text-xs font-semibold text-neutral-500">
              구성 아티스트 (2팀+)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {artists.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(picked, a.id, setPicked)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    picked.includes(a.id)
                      ? "bg-brand-500 text-white"
                      : "bg-white text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-900"
                  )}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-neutral-500">
              행사 유형 (선택)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(events, t, setEvents)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    events.includes(t)
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-900"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-500">
              세트 할인율
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="예: 10"
              className="w-20 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-xs text-neutral-400">%</span>
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            번들 만들기
          </button>
        </div>
      )}

      {/* 목록 */}
      <div className="mt-3 space-y-2">
        {bundles.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
          >
            <div className="flex -space-x-1.5">
              {b.artists.slice(0, 3).map((a) =>
                a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={a.id}
                    src={a.imageUrl}
                    alt={a.name}
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span
                    key={a.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-black text-neutral-500 ring-2 ring-white"
                  >
                    {a.name.slice(0, 1)}
                  </span>
                )
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{b.title}</p>
              <p className="truncate text-xs text-neutral-400">
                {b.artists.map((a) => a.name).join(" · ")}
                {b.budgetMax
                  ? ` · ${formatBudget(b.budgetMin ?? 0)}~${formatBudget(b.budgetMax)}`
                  : ""}
              </p>
            </div>
            {b.discountPct ? <Badge variant="solid">-{b.discountPct}%</Badge> : null}
            <button
              onClick={() => remove(b.id)}
              disabled={busyDel === b.id}
              aria-label="번들 삭제"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            >
              {busyDel === b.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
        {bundles.length === 0 && !open && (
          <div className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-xs text-neutral-400">
            {canCreate
              ? "아직 만든 번들이 없어요. '새 번들 만들기'로 아티스트를 세트로 묶어보세요."
              : agencyType !== "company"
                ? "번들은 기업·MCN(소속사) 전용이에요. 계정·요금제에서 전환하면 세트 상품을 만들 수 있어요."
                : "아티스트를 2팀 이상 등록하면 세트로 묶을 수 있어요."}
          </div>
        )}
      </div>
    </Card>
  );
}
