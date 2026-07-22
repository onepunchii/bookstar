"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
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
  Plus,
  X,
} from "lucide-react";

// 카테고리별 추천 태그 — 뭘 적을지 모를 때 클릭으로 바로 추가.
const TAG_SUGGESTIONS: Record<ArtistCategory, string[]> = {
  idol: ["축제", "행사", "팬미팅", "라이브공연", "브랜드모델", "예능", "댄스"],
  actor: ["광고촬영", "브랜드모델", "화보", "행사", "토크쇼", "내레이션"],
  model: ["화보", "런웨이", "광고촬영", "브랜드모델", "SNS협업", "피팅"],
  mc: ["행사MC", "기업행사", "시상식", "결혼식", "쇼호스트", "진행"],
  influencer: ["유튜브출연", "SNS협업", "제품리뷰", "라이브커머스", "브이로그", "챌린지"],
  athlete: ["행사", "강연", "광고촬영", "브랜드모델", "원포인트레슨"],
  speaker: ["강연", "세미나", "기업특강", "동기부여", "북토크", "패널토론"],
};
// 카테고리 무관 공통 태그
const COMMON_TAGS = ["기업행사", "신년회", "브랜드협업", "지방가능", "당일확정"];

export function ArtistEditor({ artist }: { artist: Artist }) {
  const t = useT();
  const [categories, setCategories] = useState<ArtistCategory[]>(
    artist.categories
  );
  const [tags, setTags] = useState<string[]>(artist.tags);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(WebPResult | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [converting, setConverting] = useState<number | null>(null);
  // 저장된 사진 URL (0=대표, 1~3=갤러리) — 기존 업로드 미리보기
  const [savedUrls, setSavedUrls] = useState<(string | undefined)[]>([
    artist.imageUrl,
    artist.galleryUrls?.[0],
    artist.galleryUrls?.[1],
    artist.galleryUrls?.[2],
  ]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const handlePhoto = async (idx: number, file: File | undefined | null) => {
    if (!file) return;
    setConverting(idx);
    try {
      const result = await fileToWebP(file);
      setPhotos((prev) => prev.map((p, i) => (i === idx ? result : p)));

      // 모든 슬롯 즉시 Blob+DB 반영 (0=대표→공개 프로필·사이트맵, 1~3=갤러리)
      setUploadingIdx(idx);
      setCoverError(null);
      try {
        const fd = new FormData();
        fd.append("slug", artist.slug);
        fd.append("slot", String(idx));
        fd.append("file", result.blob, result.fileName);
        const res = await fetch("/api/artists/photo", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { url: string };
        setSavedUrls((prev) => prev.map((u, i) => (i === idx ? data.url : u)));
      } catch {
        setCoverError(t("agency.artistEditor.photoSaveError"));
      } finally {
        setUploadingIdx(null);
      }
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
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((prev) => [...prev, v]);
    setTagInput("");
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? "").trim();
    const num = (k: string) => {
      const n = parseInt(str(k).replace(/[^0-9]/g, ""), 10);
      return Number.isNaN(n) ? undefined : n;
    };
    const rate = num("agencyRate");
    const payload = {
      slug: artist.slug,
      name: str("name") || undefined,
      groupName: str("groupName") || null,
      tagline: str("tagline"),
      categories,
      tags,
      budgetMin: num("budgetMin"),
      budgetMax: num("budgetMax"),
      recentWork: str("recentWork")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      presetFee: num("presetFee") ?? null,
      presetIncludes: str("presetIncludes") || null,
      presetNote: str("presetNote") || null,
      defaultAgencyRateBp: rate === undefined ? undefined : Math.round(rate * 100),
      instagram: str("instagram") || null,
      youtube: str("youtube") || null,
    };
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/artists/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setSaveError(t("agency.artistEditor.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link
        href="/agency/artists"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("agency.artistEditor.backToList")}
      </Link>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          <CheckCircle2 className="h-4 w-4" />{" "}
          {t("agency.artistEditor.savedNotice")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <form className="space-y-6 lg:col-span-2" onSubmit={handleSave}>
          {/* 사진 */}
          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-bold">{t("agency.artistEditor.photosTitle")}</h2>
                <p className="mt-1 text-xs text-neutral-400">
                  {t("agency.artistEditor.photosDesc")}
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                {t("agency.artistEditor.webpBadge")}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const photo = photos[idx];
                const isCover = idx === 0;
                const label = isCover
                  ? t("agency.artistEditor.coverUpload")
                  : null;
                const previewSrc = photo?.dataUrl ?? savedUrls[idx];
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
                    {previewSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewSrc}
                          alt={label ?? "artist photo"}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        {photo && (
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
                        )}
                        {uploadingIdx === idx && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">
                            {t("agency.artistEditor.saving")}
                          </span>
                        )}
                        {uploadingIdx !== idx && savedUrls[idx] && (
                          <span className="absolute right-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {isCover
                              ? t("agency.artistEditor.coverApplied")
                              : t("agency.artistEditor.savedBadge")}
                          </span>
                        )}
                      </>
                    ) : converting === idx ? (
                      <span className="text-xs font-semibold text-neutral-500">
                        {t("agency.artistEditor.convertingLabel")}
                      </span>
                    ) : isCover ? (
                      <>
                        <Camera className="h-6 w-6" />
                        <span className="mt-2 text-xs font-semibold">
                          {label}
                        </span>
                        <span className="mt-1 text-[10px]">
                          {t("agency.artistEditor.coverFormats")}
                        </span>
                      </>
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </label>
                );
              })}
            </div>
            {coverError && (
              <p className="mt-3 text-xs font-semibold text-red-600">
                {coverError}
              </p>
            )}
          </Card>

          {/* 기본 정보 */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">{t("agency.artistEditor.basicInfo")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">{t("agency.artistEditor.stageName")}</Label>
                <Input id="name" name="name" defaultValue={artist.name} />
              </div>
              <div>
                <Label htmlFor="group">{t("agency.artistEditor.groupName")}</Label>
                <Input
                  id="group"
                  name="groupName"
                  defaultValue={artist.groupName}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tagline">{t("agency.artistEditor.tagline")}</Label>
              <Input id="tagline" name="tagline" defaultValue={artist.tagline} />
              <p className="mt-1 text-xs text-neutral-400">
                {t("agency.artistEditor.taglineHint")}
              </p>
            </div>
            <div>
              <Label>{t("agency.artistEditor.categoryLabel")}</Label>
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
                      {t(`category.${c}`)}
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="tag-input">{t("agency.artistEditor.tagsLabel")}</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} className="gap-1 py-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={t("agency.artistEditor.tagRemove", { tag })}
                      onClick={() =>
                        setTags((prev) => prev.filter((x) => x !== tag))
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
                  placeholder={t("agency.artistEditor.tagInputPlaceholder")}
                  className="h-8 w-36 rounded-lg border border-neutral-200 px-2.5 text-sm placeholder:text-neutral-300 focus:border-brand-500 focus:outline-none"
                />
              </div>
              {/* 카테고리 기반 추천 태그 — 클릭으로 추가 */}
              {(() => {
                const pool = [
                  ...categories.flatMap((c) => TAG_SUGGESTIONS[c] ?? []),
                  ...COMMON_TAGS,
                ];
                const suggestions = [...new Set(pool)].filter(
                  (tag) => !tags.includes(tag)
                );
                if (suggestions.length === 0) return null;
                return (
                  <div className="mt-2.5">
                    <p className="mb-1.5 text-xs font-medium text-neutral-400">
                      {categories.length === 0
                        ? t("agency.artistEditor.suggestEmpty")
                        : t("agency.artistEditor.suggestPick")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.slice(0, 12).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setTags((prev) =>
                              prev.includes(tag) ? prev : [...prev, tag]
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-500 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Plus className="h-3 w-3" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* 섭외 조건 */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">{t("agency.artistEditor.bookingTerms")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="budget-min">{t("agency.artistEditor.budgetMin")}</Label>
                <Input
                  id="budget-min"
                  name="budgetMin"
                  type="number"
                  defaultValue={artist.budgetRange[0]}
                />
              </div>
              <div>
                <Label htmlFor="budget-max">{t("agency.artistEditor.budgetMax")}</Label>
                <Input
                  id="budget-max"
                  name="budgetMax"
                  type="number"
                  defaultValue={artist.budgetRange[1]}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              {t("agency.artistEditor.budgetHint")}
            </p>
            <div>
              <Label htmlFor="profile">{t("agency.artistEditor.profileDetail")}</Label>
              <Textarea
                id="profile"
                name="recentWork"
                rows={4}
                placeholder={t("agency.artistEditor.profilePlaceholder")}
                defaultValue={artist.recentWork.join("\n")}
              />
            </div>
          </Card>

          {/* 견적 프리셋 */}
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="font-bold">{t("agency.artistEditor.quotePreset")}</h2>
              <p className="mt-1 text-xs text-neutral-400">
                {t("agency.artistEditor.quotePresetHint")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="preset-fee">{t("agency.artistEditor.baseFee")}</Label>
                <Input
                  id="preset-fee"
                  name="presetFee"
                  type="number"
                  defaultValue={artist.quotePreset?.baseFee}
                  placeholder={t("agency.artistEditor.baseFeePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="preset-includes">{t("agency.artistEditor.includes")}</Label>
                <Input
                  id="preset-includes"
                  name="presetIncludes"
                  defaultValue={artist.quotePreset?.includes}
                  placeholder={t("agency.artistEditor.includesPlaceholder")}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preset-note">{t("agency.artistEditor.conditionNote")}</Label>
              <Input
                id="preset-note"
                name="presetNote"
                defaultValue={artist.quotePreset?.note}
                placeholder={t("agency.artistEditor.conditionNotePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="preset-rate">
                  {t("agency.artistEditor.agencyRate")}
                </Label>
                <Input
                  id="preset-rate"
                  name="agencyRate"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={Math.round(
                    (artist.defaultAgencyRate ?? 0.3) * 100
                  )}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  {t("agency.artistEditor.agencyRateHint")}
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-xl bg-neutral-50 p-3 text-xs">
                  <p className="text-neutral-500">{t("agency.artistEditor.currentSetting")}</p>
                  <p className="mt-0.5 font-black">
                    {t("agency.artistEditor.splitCurrent", {
                      agency: Math.round(
                        (artist.defaultAgencyRate ?? 0.3) * 100
                      ),
                      artist:
                        100 -
                        Math.round((artist.defaultAgencyRate ?? 0.3) * 100),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* SNS */}
          <Card className="space-y-4 p-6">
            <h2 className="font-bold">{t("agency.artistEditor.snsTitle")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="instagram">{t("agency.artistEditor.instagram")}</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  defaultValue={artist.instagram}
                  placeholder="@handle"
                />
              </div>
              <div>
                <Label htmlFor="youtube">{t("agency.artistEditor.youtube")}</Label>
                <Input
                  id="youtube"
                  name="youtube"
                  defaultValue={artist.youtube}
                  placeholder={t("agency.artistEditor.youtubePlaceholder")}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              {t("agency.artistEditor.snsHint")}
            </p>
          </Card>

          {saveError && (
            <p className="text-sm font-semibold text-red-600">{saveError}</p>
          )}
          <div className="flex gap-3">
            <Button size="lg" type="submit" disabled={saving}>
              {saving
                ? t("agency.artistEditor.saving")
                : t("agency.artistEditor.saveCta")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              type="button"
              onClick={() => window.open(`/@${artist.slug}`, "_blank")}
            >
              {t("agency.artistEditor.previewPublic")}
            </Button>
          </div>
        </form>

        {/* Right: completeness */}
        <div>
          <Card className="sticky top-24 p-6">
            <h3 className="text-sm font-bold text-neutral-500">
              {t("agency.artistEditor.completeness")}
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
              {t("agency.artistEditor.completenessHint")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
