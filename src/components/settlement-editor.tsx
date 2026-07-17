"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Artist, Settlement } from "@/lib/types";
import { settlementBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  artists: Artist[];
  onCreated: (settlement: Settlement) => void;
  onClose: () => void;
}

export function SettlementEditor({ artists, onCreated, onClose }: Props) {
  const findArtist = (id: string) => artists.find((a) => a.id === id);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [eventTitle, setEventTitle] = useState("");
  const [date, setDate] = useState("2026-07-30");
  const [gross, setGross] = useState<string>("");
  const [rateBp, setRateBp] = useState<string>(
    String(Math.round((artists[0]?.defaultAgencyRate ?? 0.3) * 100))
  );
  const [taxInvoice, setTaxInvoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const artist = findArtist(artistId);
    if (artist?.defaultAgencyRate !== undefined) {
      setRateBp(String(Math.round(artist.defaultAgencyRate * 100)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rate = Math.min(100, Math.max(0, Number(rateBp) || 0)) / 100;
  const grossN = Math.max(0, Number(gross) || 0);
  const artistName = findArtist(artistId)?.name ?? "";
  const preview: Settlement = {
    id: "preview",
    artistId,
    artistName,
    eventTitle: eventTitle || "미입력",
    date,
    gross: grossN,
    agencyRate: rate,
    status: "pending",
    taxInvoice,
  };
  const b = settlementBreakdown(preview);

  const canSave = eventTitle.trim().length > 0 && grossN > 0 && !!artistId;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          eventTitle,
          eventDate: date,
          gross: grossN,
          agencyRateBp: Math.round(rate * 10000),
          status: "pending",
          taxInvoice,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = (await res.json()) as { id: string };
      onCreated({
        id,
        artistId,
        artistName,
        eventTitle,
        date,
        gross: grossN,
        agencyRate: rate,
        status: "pending",
        taxInvoice,
      });
      onClose();
    } catch {
      setError("등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-6">
          <div>
            <h2 className="text-lg font-black">새 정산 등록</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              분배율은 아티스트 기본값이 자동으로 채워져요
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-artist">아티스트</Label>
              <Select
                id="s-artist"
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="s-date">이벤트 일자</Label>
              <Input
                id="s-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="s-title">이벤트명</Label>
            <Input
              id="s-title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="예: 여름 뮤직페스티벌 부산"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-gross">총 출연료 (만원)</Label>
              <Input
                id="s-gross"
                type="number"
                min={0}
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                placeholder="예: 3000"
              />
            </div>
            <div>
              <Label htmlFor="s-rate">소속사 분배율 (%)</Label>
              <Input
                id="s-rate"
                type="number"
                min={0}
                max={100}
                value={rateBp}
                onChange={(e) => setRateBp(e.target.value)}
              />
              <p className="mt-1 text-xs text-neutral-400">
                아티스트 기본값:{" "}
                {Math.round((findArtist(artistId)?.defaultAgencyRate ?? 0.3) * 100)}
                %
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={taxInvoice}
              onChange={(e) => setTaxInvoice(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            세금계산서 발행
          </label>

          {/* 계산 미리보기 */}
          <div
            className={cn(
              "rounded-xl border p-4 text-sm",
              canSave
                ? "border-brand-200 bg-brand-50/40"
                : "border-neutral-200 bg-neutral-50"
            )}
          >
            <p className="text-xs font-bold text-neutral-500">
              계산 미리보기
            </p>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between text-neutral-500">
                <dt>총 출연료</dt>
                <dd className="font-semibold text-neutral-900">
                  {grossN.toLocaleString()}만원
                </dd>
              </div>
              <div className="flex justify-between text-neutral-500">
                <dt>소속사 몫 ({Math.round(rate * 100)}%)</dt>
                <dd>{b.agencyShare.toLocaleString()}만원</dd>
              </div>
              <div className="flex justify-between text-neutral-500">
                <dt>아티스트 몫 ({Math.round((1 - rate) * 100)}%)</dt>
                <dd>{b.artistGross.toLocaleString()}만원</dd>
              </div>
              <div className="flex justify-between text-neutral-500">
                <dt>원천징수 3.3%</dt>
                <dd>-{b.withholding.toLocaleString()}만원</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                <dt>아티스트 실지급</dt>
                <dd className="text-brand-600">
                  {b.artistNet.toLocaleString()}만원
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {error && (
            <span className="mr-auto text-xs font-semibold text-red-600">
              {error}
            </span>
          )}
          <Button variant="ghost" size="md" onClick={onClose}>
            취소
          </Button>
          <Button size="md" disabled={!canSave || saving} onClick={save}>
            {saving ? "등록 중…" : "정산 등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}
