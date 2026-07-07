"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { fileToWebP, type WebPResult } from "@/lib/image";
import { profileCompleteness } from "@/lib/profile";
import {
  CATEGORY_LABELS,
  type Artist,
  type ArtistCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ImagePlus,
  X,
} from "lucide-react";

export function ArtistEditor({ artist }: { artist: Artist }) {
  const [categories, setCategories] = useState<ArtistCategory[]>(
    artist.categories
  );
  const [tags, setTags] = useState<string[]>(artist.tags);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState<(WebPResult | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [converting, setConverting] = useState<number | null>(null);

  const handlePhoto = async (idx: number, file: File | undefined | null) => {
    if (!file) return;
    setConverting(idx);
    try {
      const result = await fileToWebP(file);
      setPhotos((prev) => prev.map((p, i) => (i === idx ? result : p)));
    } finally {
      setConverting(null);
    }
  };

  const { score, items } = profileCompleteness(artist);

  const toggleCategory = (c: ArtistCategory) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  return (
    <div>
      <Link
        href="/agency/artists"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> 아티스트 목록
      </Link>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> 저장되었습니다. 변경 내용은 검수
          후 프로필에 반영돼요.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="space-y-6 lg:col-span-2">
          {/* 사진 */}
          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-bold">사진</h2>
                <p className="mt-1 text-xs text-neutral-400">
                  대표 사진 1장 + 추가 사진 3장. 첫 사진이 검색 결과에
                  노출됩니다.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                업로드 시 WebP 자동 변환
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const photo = photos[idx];
                const isCover = idx === 0;
                const label = isCover ? "대표 사진 업로드" : null;
                return (
                  <label
                    key={idx}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl transition-colors",
                      isCover && "col-span-2 row-span-2 aspect-square",
                      !isCover && "aspect-square",
                      photo
                        ? "ring-1 ring-neutral-200"
                        : "border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-brand-500 hover:text-brand-600",
                      converting === idx && "opacity-60"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handlePhoto(idx, e.target.files?.[0])
                      }
                    />
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.dataUrl}
                          alt={label ?? "artist photo"}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                          WebP · {photo.webpKB}KB
                          {photo.originalKB > photo.webpKB && (
                            <span className="ml-1 text-brand-300">
                              −
                              {Math.round(
                                ((photo.originalKB - photo.webpKB) /
                                  photo.originalKB) *
                                  100
                              )}
                              %
                            </span>
                          )}
                        </span>
                      </>
                    ) : converting === idx ? (
                      <span className="text-xs font-semibold text-neutral-500">
                        변환 중…
                      </span>
                    ) : isCover ? (
                      <>
                        <Camera className="h-6 w-6" />
                        <span className="mt-2 text-xs font-semibold">
                          {label}
                        </span>
                        <span className="mt-1 text-[10px]">
                          JPG·PNG·HEIC, 3:4 권장
                        </span>
                      </>
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* 기본 정보 */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">기본 정보</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">활동명</Label>
                <Input id="name" defaultValue={artist.name} />
              </div>
              <div>
                <Label htmlFor="group">그룹명 (선택)</Label>
                <Input id="group" defaultValue={artist.groupName} />
              </div>
            </div>
            <div>
              <Label htmlFor="tagline">한 줄 소개</Label>
              <Input id="tagline" defaultValue={artist.tagline} />
              <p className="mt-1 text-xs text-neutral-400">
                광고주가 검색 결과에서 가장 먼저 보는 문장이에요
              </p>
            </div>
            <div>
              <Label>카테고리 (복수 선택)</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                        categories.includes(c)
                          ? "bg-brand-500 text-white"
                          : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                      )}
                    >
                      {categories.includes(c) && (
                        <Check className="h-3 w-3" />
                      )}
                      {CATEGORY_LABELS[c]}
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="tag-input">태그</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} className="gap-1 py-1">
                    {t}
                    <button
                      type="button"
                      aria-label={`${t} 삭제`}
                      onClick={() =>
                        setTags((prev) => prev.filter((x) => x !== t))
                      }
                      className="text-neutral-400 hover:text-neutral-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="입력 후 Enter"
                  className="h-8 w-32 rounded-lg border border-neutral-200 px-2.5 text-sm placeholder:text-neutral-300 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* 섭외 조건 */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">섭외 조건</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="budget-min">최소 예산 (만원)</Label>
                <Input
                  id="budget-min"
                  type="number"
                  defaultValue={artist.budgetRange[0]}
                />
              </div>
              <div>
                <Label htmlFor="budget-max">최대 예산 (만원)</Label>
                <Input
                  id="budget-max"
                  type="number"
                  defaultValue={artist.budgetRange[1]}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              정확한 금액은 공개되지 않아요. 광고주 예산 필터 매칭에만
              사용됩니다.
            </p>
            <div>
              <Label htmlFor="profile">상세 프로필</Label>
              <Textarea
                id="profile"
                rows={4}
                placeholder="활동 이력, 수상, 대표 작품 등을 적어주세요"
                defaultValue={artist.recentWork.join("\n")}
              />
            </div>
          </Card>

          {/* 견적 프리셋 */}
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="font-bold">견적 프리셋</h2>
              <p className="mt-1 text-xs text-neutral-400">
                저장해두면 인박스에서 견적 회신 시 원클릭으로 채워져요
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="preset-fee">기본 출연료 (만원)</Label>
                <Input
                  id="preset-fee"
                  type="number"
                  defaultValue={artist.quotePreset?.baseFee}
                  placeholder="예: 3000"
                />
              </div>
              <div>
                <Label htmlFor="preset-includes">기본 포함 항목</Label>
                <Input
                  id="preset-includes"
                  defaultValue={artist.quotePreset?.includes}
                  placeholder="예: 공연 30분 + 포토타임"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preset-note">조건 메모</Label>
              <Input
                id="preset-note"
                defaultValue={artist.quotePreset?.note}
                placeholder="예: 지방 행사 시 이동비 별도, 심야 할증 20%"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="preset-rate">
                  소속사 분배율 (%)
                </Label>
                <Input
                  id="preset-rate"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={Math.round(
                    (artist.defaultAgencyRate ?? 0.3) * 100
                  )}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  정산 등록 시 기본값으로 채워져요
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-xl bg-neutral-50 p-3 text-xs">
                  <p className="text-neutral-500">현재 설정</p>
                  <p className="mt-0.5 font-black">
                    소속사{" "}
                    {Math.round((artist.defaultAgencyRate ?? 0.3) * 100)}% ·
                    아티스트{" "}
                    {100 - Math.round((artist.defaultAgencyRate ?? 0.3) * 100)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* SNS */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">SNS 연동</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="instagram">인스타그램</Label>
                <Input id="instagram" placeholder="@handle" />
              </div>
              <div>
                <Label htmlFor="youtube">유튜브</Label>
                <Input id="youtube" placeholder="채널 URL" />
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              연동하면 팔로워 수가 자동으로 갱신되고 프로필 신뢰도가 올라가요
            </p>
          </Card>

          <div className="flex gap-3">
            <Button size="lg" onClick={() => setSaved(true)}>
              저장하기
            </Button>
            <Button size="lg" variant="outline">
              미리보기
            </Button>
          </div>
        </div>

        {/* Right: completeness */}
        <div>
          <Card className="sticky top-24 p-6">
            <h3 className="text-sm font-bold text-neutral-500">
              프로필 완성도
            </h3>
            <p className="mt-2 text-3xl font-black">
              {score}
              <span className="text-base font-semibold text-neutral-400">
                %
              </span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${score}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={cn(
                      "flex h-4.5 w-4.5 items-center justify-center rounded-full",
                      item.done
                        ? "bg-brand-500 text-white"
                        : "bg-neutral-100 text-neutral-300"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span
                    className={
                      item.done ? "text-neutral-700" : "text-neutral-400"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
              완성도 100% 프로필은 검색 결과 상단에 우선 노출되고, 섭외 요청
              전환율이 평균 2.4배 높아요.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
