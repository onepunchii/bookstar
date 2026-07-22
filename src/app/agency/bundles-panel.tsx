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
import { useI18n } from "@/lib/i18n/client";
import { Check, Loader2, Package, Plus, Trash2, X } from "lucide-react";

const EVENT_TYPES = ["행사", "광고", "축제", "팬미팅", "강연", "예능"];
// 백엔드로 가는 값(한국어)은 유지, 표시용은 booking.type* 키로 번역
const EVENT_TYPE_KEYS: Record<string, string> = {
  행사: "booking.typeEvent",
  광고: "booking.typeAd",
  축제: "booking.typeFestival",
  팬미팅: "booking.typeFanmeeting",
  강연: "booking.typeLecture",
  예능: "booking.typeVariety",
};

export function BundlesPanel({
  bundles,
  artists,
  agencyType,
}: {
  bundles: AgencyBundle[];
  artists: Artist[];
  agencyType: string;
}) {
  const { t, locale } = useI18n();
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
    if (!title.trim()) return setError(t("agency.bundles.errNameRequired"));
    if (picked.length < 2) return setError(t("agency.bundles.errPickTwo"));
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
      if (!res.ok) throw new Error(data.error ?? t("agency.bundles.createFailed"));
      setOpen(false);
      setTitle("");
      setSubtitle("");
      setPicked([]);
      setEvents([]);
      setDiscount("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("agency.bundles.createFailedRetry"));
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("agency.bundles.deleteConfirm"))) return;
    setBusyDel(id);
    try {
      const res = await fetch(`/api/bundles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert(t("agency.bundles.deleteFailed"));
      setBusyDel(null);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
          <Package className="h-3.5 w-3.5 text-brand-500" />{" "}
          {t("agency.bundles.title", { n: bundles.length })}
        </h2>
        {canCreate ? (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {open ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {open ? t("common.close") : t("agency.bundles.newBundle")}
          </button>
        ) : (
          <Link
            href="/agency/account"
            className="shrink-0 whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-700"
          >
            {agencyType !== "company"
              ? t("agency.bundles.companyOnlyUpgrade")
              : t("agency.bundles.needTwoArtists")}
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        {t("agency.bundles.subtitle")}
      </p>

      {/* 생성 폼 */}
      {open && (
        <div className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("agency.bundles.namePlaceholder")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t("agency.bundles.subtitlePlaceholder")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div>
            <p className="mb-1.5 text-xs font-semibold text-neutral-500">
              {t("agency.bundles.artistsLabel")}
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
              {t("agency.bundles.eventTypesLabel")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((evt) => (
                <button
                  key={evt}
                  type="button"
                  onClick={() => toggle(events, evt, setEvents)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    events.includes(evt)
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-900"
                  )}
                >
                  {t(EVENT_TYPE_KEYS[evt])}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-500">
              {t("agency.bundles.discountLabel")}
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder={t("agency.bundles.discountPlaceholder")}
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
            {t("agency.bundles.createCta")}
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
                  ? ` · ${formatBudget(b.budgetMin ?? 0, locale)}~${formatBudget(b.budgetMax, locale)}`
                  : ""}
              </p>
            </div>
            {b.discountPct ? <Badge variant="solid">-{b.discountPct}%</Badge> : null}
            <button
              onClick={() => remove(b.id)}
              disabled={busyDel === b.id}
              aria-label={t("agency.bundles.deleteAria")}
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
              ? t("agency.bundles.emptyCanCreate")
              : agencyType !== "company"
                ? t("agency.bundles.emptyCompanyOnly")
                : t("agency.bundles.emptyNeedTwo")}
          </div>
        )}
      </div>
    </Card>
  );
}
