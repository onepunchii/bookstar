"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { fileToWebP, type WebPResult } from "@/lib/image";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { ArrowRight, Camera, Check, Loader2, Sparkles } from "lucide-react";

// 크리에이터·인플루언서용 카테고리 서브셋
const CREATOR_CATEGORIES: ArtistCategory[] = [
  "influencer",
  "mc",
  "model",
  "athlete",
  "speaker",
];

const TAG_SUGGESTIONS = [
  "뷰티",
  "패션",
  "F&B",
  "라이프스타일",
  "여행",
  "IT",
  "게임",
  "육아",
  "운동",
  "브이로그",
  "리뷰",
  "숏폼",
];

const STEP_LABELS = [
  "join.creator.step1",
  "join.creator.step2",
  "join.creator.step3",
  "join.creator.step4",
  "join.creator.step5",
];

export function CreatorWizard() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ArtistCategory>("influencer");
  const [gender, setGender] = useState<"male" | "female" | "group">("female");
  const [region, setRegion] = useState(t("join.creator.regionDefault"));

  const [handle, setHandle] = useState("");
  const [youtube, setYoutube] = useState("");
  const [snsLoading, setSnsLoading] = useState(false);
  const [snsResult, setSnsResult] = useState<{
    followers: number;
    verified: boolean;
  } | null>(null);

  const [baseFee, setBaseFee] = useState<string>("");
  const [includes, setIncludes] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [photo, setPhoto] = useState<WebPResult | null>(null);
  const [converting, setConverting] = useState(false);

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );

  const canNext =
    (step === 0 && name.trim().length >= 2) ||
    (step === 1 && handle.trim().length >= 2) ||
    (step === 2 && baseFee && Number(baseFee) > 0) ||
    step === 3 ||
    step === 4;

  const simulateSNS = () => {
    if (!handle.trim()) return;
    setSnsLoading(true);
    setSnsResult(null);
    setTimeout(() => {
      // 결정적 팔로워 수 시뮬레이션
      const seed = handle
        .split("")
        .reduce((s, c) => s + c.charCodeAt(0), 0);
      const followers = 10000 + (seed * 137) % 2000000;
      setSnsResult({ followers, verified: followers > 100000 });
      setSnsLoading(false);
    }, 1200);
  };

  const handlePhoto = async (file: File | undefined | null) => {
    if (!file) return;
    setConverting(true);
    try {
      const result = await fileToWebP(file);
      setPhoto(result);
    } finally {
      setConverting(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const finalize = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const desiredSlug =
      handle.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "creator";
    try {
      const res = await fetch("/api/join/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: desiredSlug,
          category,
          gender,
          instagram: handle ? `@${handle.replace(/^@/, "")}` : undefined,
          youtube: youtube || undefined,
          baseFee: Number(baseFee) || undefined,
          includes: includes || undefined,
          tags,
          followers: snsResult?.followers ?? 0,
        }),
      });
      if (res.status === 401) {
        // 카카오 로그인 후 이어서 등록
        router.push("/login?callbackUrl=/join/creator");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { slug } = (await res.json()) as { slug: string };
      // 프로필 사진이 있으면 업로드 (로그인 상태)
      if (photo) {
        const fd = new FormData();
        fd.append("slug", slug);
        fd.append("slot", "0");
        fd.append("file", photo.blob, photo.fileName);
        await fetch("/api/artists/photo", { method: "POST", body: fd }).catch(
          () => {}
        );
      }
      const params = new URLSearchParams({
        name,
        slug,
        category,
        followers: String(snsResult?.followers ?? 0),
      });
      router.push(`/join/complete?${params.toString()}` as never);
    } catch {
      setSaveError(t("join.creator.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* 스텝 인디케이터 */}
      <div className="mb-6 flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex flex-1 flex-col items-start gap-1",
              i > step && "opacity-40"
            )}
          >
            <div
              className={cn(
                "h-1 w-full rounded-full",
                i < step
                  ? "bg-brand-500"
                  : i === step
                    ? "bg-brand-500"
                    : "bg-neutral-200"
              )}
            />
            <span className="text-[10px] font-bold text-neutral-500">
              {String(i + 1).padStart(2, "0")} · {t(label)}
            </span>
          </div>
        ))}
      </div>

      {/* 스텝 콘텐츠 */}
      <Card className="p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">{t("join.creator.step1")}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("join.creator.step1Desc")}
              </p>
            </div>
            <div>
              <Label htmlFor="w-name">{t("join.creator.name")}</Label>
              <Input
                id="w-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("join.creator.namePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("join.creator.category")}</Label>
              <div className="flex flex-wrap gap-2">
                {CREATOR_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      category === c
                        ? "bg-brand-500 text-white"
                        : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                    )}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>{t("join.creator.gender")}</Label>
              <div className="flex gap-2">
                {(
                  [
                    ["female", "join.creator.genderFemale"],
                    ["male", "join.creator.genderMale"],
                    ["group", "join.creator.genderGroup"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setGender(v)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      gender === v
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 text-neutral-600"
                    )}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="w-region">{t("join.creator.region")}</Label>
              <Input
                id="w-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t("join.creator.regionPlaceholder")}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">{t("join.creator.step2")}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("join.creator.step2Desc")}
              </p>
            </div>
            <div>
              <Label htmlFor="w-handle">{t("join.creator.instaHandle")}</Label>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 focus-within:border-brand-500">
                <span className="text-sm font-bold text-neutral-400">@</span>
                <input
                  id="w-handle"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value);
                    setSnsResult(null);
                  }}
                  onBlur={simulateSNS}
                  placeholder="haneul"
                  className="h-10 flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {handle && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  {t("join.creator.yourLink")}{" "}
                  <span className="font-semibold text-neutral-900">
                    xong.co.kr/@{handle.toLowerCase()}
                  </span>
                </p>
              )}
            </div>
            {snsLoading && (
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                {t("join.creator.snsChecking")}
              </div>
            )}
            {snsResult && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-500" />
                  <span className="text-sm font-bold text-brand-700">
                    {t("join.creator.snsDone")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-700">
                  {t("join.creator.followers")}{" "}
                  <span className="text-lg font-black text-brand-600">
                    {t("join.creator.followerCount", {
                      n: (snsResult.followers / 10000).toFixed(1),
                    })}
                  </span>
                  {snsResult.verified && (
                    <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {t("join.creator.influencerBadge")}
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="w-yt">
                {t("join.creator.youtube")} {t("common.optional")}
              </Label>
              <Input
                id="w-yt"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder={t("join.creator.youtubePlaceholder")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">
                {t("join.creator.step3Title")}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("join.creator.step3Desc")}
              </p>
            </div>
            <div>
              <Label htmlFor="w-fee">{t("join.creator.baseFee")}</Label>
              <Input
                id="w-fee"
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                placeholder={t("join.creator.baseFeePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="w-incl">{t("join.creator.includes")}</Label>
              <Textarea
                id="w-incl"
                rows={2}
                value={includes}
                onChange={(e) => setIncludes(e.target.value)}
                placeholder={t("join.creator.includesPlaceholder")}
              />
            </div>
            <div>
              <Label>{t("join.creator.imageTags")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      tags.includes(tag)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-neutral-200 text-neutral-600 hover:border-brand-500"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                {tags.length > 0
                  ? t("join.creator.tagsSelected", { n: tags.length })
                  : t("join.creator.tagsHint")}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">{t("join.creator.step4")}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("join.creator.step4Desc")}
              </p>
            </div>
            <label
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl text-neutral-400 transition-colors",
                "aspect-square w-full",
                photo
                  ? "ring-1 ring-neutral-200"
                  : "border-2 border-dashed border-neutral-300 hover:border-brand-500",
                converting && "opacity-60"
              )}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0])}
              />
              {photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl}
                    alt={t("join.creator.photoPreviewAlt")}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {t("join.creator.webpBadge", { kb: photo.webpKB })}
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
              ) : converting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                  <span className="mt-2 text-sm">
                    {t("join.creator.converting")}
                  </span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8" />
                  <span className="mt-2 text-sm font-semibold">
                    {t("join.creator.uploadPhoto")}
                  </span>
                  <span className="mt-1 text-xs">
                    {t("join.creator.uploadHint")}
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">
                {t("join.creator.readyTitle")}{" "}
                <span className="text-brand-500">🎉</span>
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("join.creator.readyDesc")}
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-neutral-50 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">{t("join.creator.name")}</span>
                <span className="font-bold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {t("join.creator.category")}
                </span>
                <span className="font-bold">{CATEGORY_LABELS[category]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {t("join.creator.instaHandleSummary")}
                </span>
                <span className="font-bold">@{handle.toLowerCase()}</span>
              </div>
              {snsResult && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {t("join.creator.followers")}
                  </span>
                  <span className="font-bold text-brand-600">
                    {t("join.creator.followerCount", {
                      n: (snsResult.followers / 10000).toFixed(1),
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {t("join.creator.baseFeeSummary")}
                </span>
                <span className="font-bold">
                  {t("join.creator.feeAmount", {
                    amount: Number(baseFee).toLocaleString(),
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {t("join.creator.imageTags")}
                </span>
                <span className="max-w-[60%] text-right font-bold">
                  {tags.length > 0 ? tags.join(" · ") : t("join.creator.none")}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                <Sparkles className="h-4 w-4" /> {t("join.creator.linkToIssue")}
              </p>
              <p className="mt-1 text-sm font-black text-neutral-900">
                xong.co.kr/@{handle.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {t("join.creator.linkHint")}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 하단 네비 */}
      <div className="mt-5 flex items-center justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm font-semibold text-neutral-400 hover:text-neutral-900"
          >
            ← {t("join.creator.prev")}
          </button>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <Button
            size="lg"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            {t("join.creator.next")} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            {saveError && (
              <span className="text-xs font-semibold text-red-600">
                {saveError}
              </span>
            )}
            <Button size="lg" disabled={saving} onClick={finalize}>
              {saving ? t("join.creator.saving") : t("join.creator.publish")}{" "}
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
