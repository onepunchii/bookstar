"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChipMulti } from "@/components/ui/chip-multi";
import { Input, Label, Textarea } from "@/components/ui/input";
import { RepeatRows } from "@/components/ui/repeat-rows";
import { Segmented } from "@/components/ui/segmented";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { YearInput } from "@/components/ui/year-input";
import { useT } from "@/lib/i18n/client";
import { fileToWebP, type WebPResult } from "@/lib/image";
import { profileCompleteness } from "@/lib/profile";
import {
  creditTypesFor,
  EVENT_TYPES,
  LANGUAGE_LEVELS,
  LINK_TYPES,
  MAX_REGIONS,
  REGIONS,
  SKILL_LEVELS,
  SKILL_SUGGESTIONS,
  CHANNEL_PLATFORMS,
  specFieldsFor,
  usesChannels,
  usesHeight,
  usesWeight,
} from "@/lib/profile-fields";
import {
  CATEGORY_LABELS,
  type Artist,
  type ArtistCategory,
  type ArtistChannel,
  type ArtistCredit,
  type ArtistLanguage,
  type ArtistLink,
  type ArtistSkill,
  type ArtistVideo,
  type FieldVisibility,
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
import { FieldBlock } from "./field-block";

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
const COMMON_TAGS = ["기업행사", "신년회", "브랜드협업", "지방가능", "당일확정"];

/** 편집 중인 값 — 블록이 접히면 DOM에서 사라지므로 FormData가 아니라 상태로 든다 */
type Draft = {
  name: string;
  groupName: string;
  tagline: string;
  nameLocalized: Record<string, string>;
  categories: ArtistCategory[];
  gender?: "male" | "female" | "group";
  birthYear?: number;
  tags: string[];
  budgetMin?: number;
  budgetMax?: number;
  acceptedEventTypes: string[];
  activeRegions: string[];
  minLeadDays?: number;
  languages: ArtistLanguage[];
  channels: ArtistChannel[];
  careerStartYear?: number;
  credits: ArtistCredit[];
  bio: string;
  skills: ArtistSkill[];
  videos: ArtistVideo[];
  instagram: string;
  youtube: string;
  links: ArtistLink[];
  heightCm?: number;
  weightKg?: number;
  fieldVisibility: Record<string, FieldVisibility>;
  /** 카테고리 전용 스펙 — profileExtras.spec */
  spec: Record<string, unknown>;
  presetFee?: number;
  presetIncludes: string;
  presetNote: string;
  agencyRate?: number;
};

export function ArtistEditor({
  artist,
  scope = "agency",
}: {
  artist: Artist;
  /** creator = 본인 셀프 편집 — 단가·분배율 같은 운영값은 소속사가 정하므로 숨긴다 */
  scope?: "agency" | "creator";
}) {
  const isCreator = scope === "creator";
  const t = useT();

  const [draft, setDraft] = useState<Draft>(() => ({
    name: artist.name,
    groupName: artist.groupName ?? "",
    tagline: artist.tagline ?? "",
    nameLocalized: artist.nameLocalized ?? {},
    categories: artist.categories,
    gender: artist.gender,
    birthYear: artist.birthYear,
    tags: artist.tags,
    budgetMin: artist.budgetRange[0] || undefined,
    budgetMax: artist.budgetRange[1] || undefined,
    acceptedEventTypes: artist.acceptedEventTypes ?? [],
    activeRegions: artist.activeRegions ?? [],
    minLeadDays: artist.minLeadDays,
    languages: artist.languages ?? [],
    channels: artist.channels ?? [],
    careerStartYear: artist.careerStartYear,
    credits: artist.credits ?? [],
    bio: artist.bio ?? "",
    skills: artist.skills ?? [],
    videos: artist.videos ?? [],
    instagram: artist.instagram ?? "",
    youtube: artist.youtube ?? "",
    links: artist.links ?? [],
    heightCm: artist.heightCm,
    weightKg: artist.weightKg,
    fieldVisibility: artist.fieldVisibility ?? {},
    spec: ((artist.profileExtras?.spec ?? {}) as Record<string, unknown>),
    presetFee: artist.quotePreset?.baseFee,
    presetIncludes: artist.quotePreset?.includes ?? "",
    presetNote: artist.quotePreset?.note ?? "",
    agencyRate:
      artist.defaultAgencyRate !== undefined
        ? Math.round(artist.defaultAgencyRate * 100)
        : undefined,
  }));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 사진은 별도 저장 모델(슬롯 즉시 업로드)이라 draft에 넣지 않는다
  // 대표 1 + 갤러리 8 — 1인 기획사에게 이 페이지가 사실상 홈페이지라 포트폴리오 분량이 필요하다
  const PHOTO_SLOTS = 9;
  const [photos, setPhotos] = useState<(WebPResult | null)[]>(
    () => Array(PHOTO_SLOTS).fill(null)
  );
  const [converting, setConverting] = useState<number | null>(null);
  const [savedUrls, setSavedUrls] = useState<(string | undefined)[]>(() => [
    artist.imageUrl,
    ...Array.from({ length: PHOTO_SLOTS - 1 }, (_, i) => artist.galleryUrls?.[i]),
  ]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const handlePhoto = async (idx: number, file: File | undefined | null) => {
    if (!file) return;
    setConverting(idx);
    try {
      const result = await fileToWebP(file);
      setPhotos((prev) => prev.map((p, i) => (i === idx ? result : p)));
      setUploadingIdx(idx);
      setCoverError(null);
      try {
        const fd = new FormData();
        fd.append("slug", artist.slug);
        fd.append("slot", String(idx));
        fd.append("file", result.blob, result.fileName);
        const res = await fetch("/api/artists/photo", { method: "POST", body: fd });
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

  // 완성도는 저장된 값이 아니라 편집 중인 draft 기준이어야 즉시 보상이 생긴다
  const { score, items } = useMemo(
    () =>
      profileCompleteness({
        ...artist,
        ...draft,
        imageUrl: savedUrls[0],
        budgetRange: [draft.budgetMin ?? 0, draft.budgetMax ?? 0],
      } as Artist),
    [artist, draft, savedUrls]
  );

  // 첫 진입에 펼쳐진 블록은 1~2장 — 미완 항목이 있는 첫 블록만 연다
  const firstTodo = items.find((i) => !i.done)?.block ?? "head";
  const [open, setOpen] = useState<Record<string, boolean>>({ [firstTodo]: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const jumpTo = (id: string) => {
    setOpen((o) => ({ ...o, [id]: true }));
    requestAnimationFrame(() =>
      document.getElementById(`blk-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  };

  const cats = draft.categories;
  const creditTypes = useMemo(() => creditTypesFor(cats), [cats]);
  const showHeight = usesHeight(cats);
  const showWeight = usesWeight(cats);
  const showChannels = usesChannels(cats);
  const specGroups = useMemo(() => specFieldsFor(cats), [cats]);
  const setSpec = (key: string, v: unknown) =>
    setDraft((d) => ({ ...d, spec: { ...d.spec, [key]: v } }));

  const vis = (k: string): FieldVisibility =>
    draft.fieldVisibility[k] ?? (k === "weight" ? "private" : "public");
  const setVis = (k: string, v: FieldVisibility) =>
    set("fieldVisibility", { ...draft.fieldVisibility, [k]: v });
  const visLabels: Record<FieldVisibility, string> = {
    public: t("agency.visibility.public"),
    members: t("agency.visibility.members"),
    private: t("agency.visibility.private"),
  };

  // 함수형 업데이트 — 렌더 클로저의 cats를 읽으면 같은 틱의 두 번째 토글이
  // 첫 번째를 덮어쓴다(칩을 빠르게 연달아 누르면 변경이 사라짐).
  const toggleCategory = (c: ArtistCategory) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(c)
        ? d.categories.filter((x) => x !== c)
        : [...d.categories, c],
    }));
  /** 대표 카테고리 — categories[0]이 JSON-LD·메타데이터·관련 아티스트를 결정한다 */
  const makePrimary = (c: ArtistCategory) =>
    setDraft((d) => ({
      ...d,
      categories: [c, ...d.categories.filter((x) => x !== c)],
    }));

  const addTag = () => {
    const v = tagInput.trim();
    setDraft((d) =>
      v && !d.tags.includes(v) ? { ...d, tags: [...d.tags, v] } : d
    );
    setTagInput("");
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/artists/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: artist.slug,
          name: draft.name.trim() || undefined,
          groupName: draft.groupName.trim() || null,
          tagline: draft.tagline,
          nameLocalized: draft.nameLocalized,
          categories: cats,
          gender: draft.gender ?? null,
          birthYear: draft.birthYear ?? null,
          tags: draft.tags,
          acceptedEventTypes: draft.acceptedEventTypes,
          activeRegions: draft.activeRegions,
          minLeadDays: draft.minLeadDays ?? null,
          languages: draft.languages.filter((l) => l.lang.trim()),
          channels: showChannels
            ? draft.channels.filter((c) => c.platform)
            : null,
          careerStartYear: draft.careerStartYear ?? null,
          credits: draft.credits.filter((c) => c.title.trim()),
          bio: draft.bio,
          skills: draft.skills.filter((s) => s.name.trim()),
          videos: draft.videos.filter((v) => v.url.trim()),
          instagram: draft.instagram.trim() || null,
          youtube: draft.youtube.trim() || null,
          links: draft.links.filter((l) => l.url.trim()),
          heightCm: showHeight ? (draft.heightCm ?? null) : null,
          weightKg: showWeight ? (draft.weightKg ?? null) : null,
          fieldVisibility: draft.fieldVisibility,
          profileExtras: { ...(artist.profileExtras ?? {}), spec: draft.spec },
          ...(isCreator
            ? {}
            : {
                budgetMin: draft.budgetMin,
                budgetMax: draft.budgetMax,
                presetFee: draft.presetFee ?? null,
                presetIncludes: draft.presetIncludes.trim() || null,
                presetNote: draft.presetNote.trim() || null,
                defaultAgencyRateBp:
                  draft.agencyRate === undefined
                    ? undefined
                    : Math.round(draft.agencyRate * 100),
              }),
        }),
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

  const sum = (...parts: (string | number | undefined | null | false)[]) =>
    parts.filter(Boolean).join(" · ");

  return (
    // data-noswipe — 편집 중 좌우 스와이프로 다른 탭에 튕겨 입력이 날아가는 것을 막는다
    <div data-noswipe>
      <Link
        href={isCreator ? "/me" : "/agency/artists"}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />{" "}
        {isCreator ? t("me.profile.back") : t("agency.artistEditor.backToList")}
      </Link>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> {t("agency.artistEditor.savedNotice")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {/* ── 1. 프로필 헤드 ── */}
          <div id="blk-head">
            <FieldBlock
              title={t("agency.block.head")}
              hint={t("agency.block.headHint")}
              summary={sum(draft.name, draft.tagline)}
              done={Boolean(savedUrls[0] && draft.tagline.length >= 10)}
              open={!!open.head}
              onToggle={() => toggle("head")}
            >
              {/* 사진 — 슬롯마다 즉시 업로드(별도 저장 모델) */}
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Label>{t("agency.artistEditor.photosTitle")}</Label>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                    {t("agency.artistEditor.webpBadge")}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  {Array.from({ length: PHOTO_SLOTS }, (_, idx) => {
                    const photo = photos[idx];
                    const isCover = idx === 0;
                    const previewSrc = photo?.dataUrl ?? savedUrls[idx];
                    return (
                      <label
                        key={idx}
                        className={cn(
                          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl transition-colors aspect-square",
                          isCover && "col-span-2 row-span-2",
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
                          onChange={(e) => handlePhoto(idx, e.target.files?.[0])}
                        />
                        {previewSrc ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewSrc}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
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
                              {t("agency.artistEditor.coverUpload")}
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
                  <p className="mt-2 text-xs font-semibold text-red-600">{coverError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t("agency.artistEditor.stageName")}</Label>
                  <Input
                    id="name"
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="group">{t("agency.artistEditor.groupName")}</Label>
                  <Input
                    id="group"
                    value={draft.groupName}
                    onChange={(e) => set("groupName", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tagline">{t("agency.artistEditor.tagline")}</Label>
                <Input
                  id="tagline"
                  value={draft.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  {t("agency.artistEditor.taglineHint")}
                </p>
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
                  {t("agency.artistEditor.localizedNames")}
                </summary>
                <p className="mb-2 mt-1 text-xs text-neutral-400">
                  {t("agency.artistEditor.localizedNamesHint")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["en", "English", "Rescene"],
                      ["ja", "日本語", "リセンヌ"],
                      ["zh-TW", "繁體中文", "麗聲"],
                      ["th", "ไทย", "รีเซเนอ"],
                    ] as const
                  ).map(([loc, langLabel, ph]) => (
                    <div key={loc}>
                      <Label className="text-xs text-neutral-400">{langLabel}</Label>
                      <Input
                        placeholder={ph}
                        value={draft.nameLocalized[loc] ?? ""}
                        onChange={(e) =>
                          set("nameLocalized", {
                            ...draft.nameLocalized,
                            [loc]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </details>
            </FieldBlock>
          </div>

          {/* ── 2. 정체성 ── */}
          <div id="blk-identity">
            <FieldBlock
              title={t("agency.block.identity")}
              hint={t("agency.block.identityHint")}
              summary={sum(
                cats.map((c) => t(`category.${c}`)).join(", "),
                draft.gender && t(`profile.gender.${draft.gender}`),
                draft.birthYear && `${draft.birthYear}`
              )}
              done={cats.length > 0}
              open={!!open.identity}
              onToggle={() => toggle("identity")}
            >
              <div>
                <Label>{t("agency.artistEditor.categoryLabel")}</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => {
                    const on = cats.includes(c);
                    const primary = cats[0] === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCategory(c)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                          on
                            ? "bg-brand-500 text-white"
                            : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                        {t(`category.${c}`)}
                        {primary && (
                          <span className="ml-0.5 rounded bg-white/25 px-1 text-[10px] font-bold">
                            {t("agency.artistEditor.primaryBadge")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {cats.length > 1 && (
                  <p className="mt-2 text-xs text-neutral-400">
                    {t("agency.artistEditor.primaryHint")}{" "}
                    {cats.slice(1).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => makePrimary(c)}
                        className="mr-1.5 font-semibold text-brand-600 hover:underline"
                      >
                        {t(`category.${c}`)}
                      </button>
                    ))}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("profile.spec.gender")}</Label>
                  <Segmented
                    allowClear
                    value={draft.gender}
                    onChange={(v) => set("gender", v)}
                    options={[
                      { value: "male" as const, label: t("profile.gender.male") },
                      { value: "female" as const, label: t("profile.gender.female") },
                      { value: "group" as const, label: t("profile.gender.group") },
                    ]}
                  />
                </div>
                <div>
                  <Label htmlFor="birthYear">{t("profile.spec.birthYear")}</Label>
                  <YearInput
                    id="birthYear"
                    value={draft.birthYear}
                    onChange={(v) => set("birthYear", v)}
                    placeholder="1996"
                    badge={
                      draft.birthYear
                        ? t("agency.artistEditor.ageBadge", {
                            n: new Date().getFullYear() - draft.birthYear + 1,
                          })
                        : undefined
                    }
                  />
                </div>
              </div>
            </FieldBlock>
          </div>

          {/* ── 3. 태그 ── */}
          <div id="blk-tags">
            <FieldBlock
              title={t("agency.block.tags")}
              hint={t("agency.block.tagsHint")}
              summary={draft.tags.join(", ")}
              done={draft.tags.length >= 3}
              open={!!open.tags}
              onToggle={() => toggle("tags")}
            >
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== tag) }))
                      }
                      className="text-neutral-400 hover:text-neutral-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={t("agency.artistEditor.tagPlaceholder")}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...cats.flatMap((c) => TAG_SUGGESTIONS[c] ?? []), ...COMMON_TAGS])]
                  .filter((s) => !draft.tags.includes(s))
                  .slice(0, 12)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, tags: [...d.tags, s] }))}
                      className="rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-brand-500 hover:text-brand-600"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </FieldBlock>
          </div>

          {/* ── 4. 섭외 조건 ── */}
          <div id="blk-booking">
            <FieldBlock
              title={t("agency.block.booking")}
              hint={t("agency.block.bookingHint")}
              summary={sum(
                draft.budgetMin && `${draft.budgetMin}~${draft.budgetMax ?? ""}만원`,
                draft.activeRegions.join("/"),
                draft.acceptedEventTypes.join("/")
              )}
              done={Boolean(draft.budgetMin) && draft.activeRegions.length > 0}
              open={!!open.booking}
              onToggle={() => toggle("booking")}
            >
              {!isCreator && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="budget-min">{t("agency.artistEditor.budgetMin")}</Label>
                  <Input
                    id="budget-min"
                    inputMode="numeric"
                    value={draft.budgetMin ?? ""}
                    onChange={(e) =>
                      set("budgetMin", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="budget-max">{t("agency.artistEditor.budgetMax")}</Label>
                  <Input
                    id="budget-max"
                    inputMode="numeric"
                    value={draft.budgetMax ?? ""}
                    onChange={(e) =>
                      set("budgetMax", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                    }
                  />
                </div>
              </div>
              )}
              <div>
                <Label>{t("profile.spec.eventTypes")}</Label>
                <ChipMulti
                  options={EVENT_TYPES}
                  value={draft.acceptedEventTypes}
                  onChange={(v) => set("acceptedEventTypes", v)}
                />
              </div>
              <div>
                <Label>{t("profile.spec.regions")}</Label>
                <ChipMulti
                  options={REGIONS}
                  value={draft.activeRegions}
                  onChange={(v) => set("activeRegions", v)}
                  max={MAX_REGIONS}
                />
              </div>
              <div>
                <Label>{t("profile.spec.leadTime")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("minLeadDays", draft.minLeadDays === d ? undefined : d)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                        draft.minLeadDays === d
                          ? "bg-brand-500 text-white"
                          : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                      )}
                    >
                      {t("profile.spec.leadTimeValue", { n: d })}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t("profile.spec.languages")}</Label>
                <RepeatRows<ArtistLanguage>
                  value={draft.languages}
                  onChange={(v) => set("languages", v)}
                  blank={() => ({ lang: "" })}
                  max={5}
                  addLabel={t("agency.artistEditor.addRow")}
                  renderRow={(row, update) => (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={row.lang}
                        onChange={(e) => update({ lang: e.target.value })}
                        placeholder={t("agency.artistEditor.langPlaceholder")}
                        className="w-32"
                      />
                      <Segmented
                        allowClear
                        value={row.level}
                        onChange={(v) => update({ level: v })}
                        options={LANGUAGE_LEVELS.map((l) => ({
                          value: l.value,
                          label: t(`profile.langLevel.${l.value}`),
                        }))}
                      />
                    </div>
                  )}
                />
              </div>
            </FieldBlock>
          </div>

          {/* ── 5. 커리어 ── */}
          <div id="blk-career">
            <FieldBlock
              title={t("agency.block.career")}
              hint={t("agency.block.careerHint")}
              summary={sum(
                draft.credits.length && t("agency.artistEditor.creditCount", { n: draft.credits.length }),
                draft.skills.map((s) => s.name).slice(0, 3).join("/")
              )}
              done={draft.credits.length >= 2 && draft.bio.length >= 30}
              open={!!open.career}
              onToggle={() => toggle("career")}
            >
              <div>
                <Label htmlFor="careerStart">{t("profile.spec.career")}</Label>
                <YearInput
                  id="careerStart"
                  value={draft.careerStartYear}
                  onChange={(v) => set("careerStartYear", v)}
                  placeholder="2019"
                  badge={
                    draft.careerStartYear
                      ? t("agency.artistEditor.careerBadge", {
                          n: Math.max(new Date().getFullYear() - draft.careerStartYear, 0),
                        })
                      : undefined
                  }
                />
              </div>
              <div>
                <Label>{t("profile.credits.heading")}</Label>
                <RepeatRows<ArtistCredit>
                  value={draft.credits}
                  onChange={(v) => set("credits", v)}
                  blank={() => ({ type: creditTypes[0] ?? "", title: "" })}
                  max={30}
                  reorderable
                  addLabel={t("agency.artistEditor.addRow")}
                  emptyHint={t("agency.artistEditor.creditsHint")}
                  renderRow={(row, update) => (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={row.type}
                          onChange={(e) => update({ type: e.target.value })}
                          className="h-10 w-28 shrink-0 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
                        >
                          {creditTypes.map((ct) => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                        </select>
                        <Input
                          inputMode="numeric"
                          maxLength={4}
                          value={row.year ?? ""}
                          onChange={(e) =>
                            update({
                              year: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined,
                            })
                          }
                          placeholder="2026"
                          className="w-20"
                        />
                        <Input
                          value={row.title}
                          onChange={(e) => update({ title: e.target.value })}
                          placeholder={t("agency.artistEditor.creditTitle")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={row.role ?? ""}
                          onChange={(e) => update({ role: e.target.value })}
                          placeholder={t("agency.artistEditor.creditRole")}
                        />
                        <button
                          type="button"
                          onClick={() => update({ highlighted: !row.highlighted })}
                          className={cn(
                            "shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
                            row.highlighted
                              ? "bg-brand-500 text-white"
                              : "border border-neutral-200 text-neutral-400 hover:border-brand-500"
                          )}
                        >
                          ★ {t("agency.artistEditor.highlight")}
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="bio">{t("profile.about.heading")}</Label>
                <Textarea
                  id="bio"
                  rows={5}
                  value={draft.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder={t("agency.artistEditor.bioPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("profile.spec.skills")}</Label>
                <RepeatRows<ArtistSkill>
                  value={draft.skills}
                  onChange={(v) => set("skills", v)}
                  blank={() => ({ name: "" })}
                  max={12}
                  addLabel={t("agency.artistEditor.addRow")}
                  renderRow={(row, update) => (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={row.name}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder={t("agency.artistEditor.skillPlaceholder")}
                        className="w-36"
                      />
                      <Segmented
                        allowClear
                        value={row.level}
                        onChange={(v) => update({ level: v })}
                        options={SKILL_LEVELS.map((l) => ({
                          value: l.value,
                          label: t(`profile.skillLevel.${l.value}`),
                        }))}
                      />
                    </div>
                  )}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.flatMap((g) => g.items)
                    .filter((s) => !draft.skills.some((x) => x.name === s))
                    .slice(0, 10)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            skills: [...d.skills.filter((x) => x.name), { name: s }],
                          }))
                        }
                        className="rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-brand-500 hover:text-brand-600"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </FieldBlock>
          </div>

          {/* ── 6. 미디어 ── */}
          <div id="blk-media">
            <FieldBlock
              title={t("agency.block.media")}
              hint={t("agency.block.mediaHint")}
              summary={sum(
                draft.instagram,
                draft.youtube,
                draft.videos.length && t("agency.artistEditor.videoCount", { n: draft.videos.length })
              )}
              done={draft.videos.length > 0}
              open={!!open.media}
              onToggle={() => toggle("media")}
            >
              <div>
                <Label>{t("profile.videos.heading")}</Label>
                <RepeatRows<ArtistVideo>
                  value={draft.videos}
                  onChange={(v) => set("videos", v)}
                  blank={() => ({ url: "" })}
                  max={3}
                  addLabel={t("agency.artistEditor.addRow")}
                  renderRow={(row, update) => (
                    <div className="space-y-2">
                      <Input
                        value={row.url}
                        onChange={(e) => update({ url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <Input
                        value={row.title ?? ""}
                        onChange={(e) => update({ title: e.target.value })}
                        placeholder={t("agency.artistEditor.videoTitle")}
                      />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="instagram">{t("agency.artistEditor.instagram")}</Label>
                  <Input
                    id="instagram"
                    value={draft.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">{t("agency.artistEditor.youtube")}</Label>
                  <Input
                    id="youtube"
                    value={draft.youtube}
                    onChange={(e) => set("youtube", e.target.value)}
                    placeholder="@channel"
                  />
                </div>
              </div>
              {showChannels && (
                <div>
                  <Label>{t("profile.channels.heading")}</Label>
                  <p className="mb-2 text-xs text-neutral-400">
                    {t("agency.artistEditor.channelsHint")}
                  </p>
                  <RepeatRows<ArtistChannel>
                    value={draft.channels}
                    onChange={(v) => set("channels", v)}
                    blank={() => ({ platform: "instagram", source: "self" })}
                    max={6}
                    addLabel={t("agency.artistEditor.addRow")}
                    renderRow={(row, update) => (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={row.platform}
                            onChange={(e) => update({ platform: e.target.value })}
                            className="h-10 w-32 shrink-0 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
                          >
                            {CHANNEL_PLATFORMS.map((pl) => (
                              <option key={pl.value} value={pl.value}>
                                {pl.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            value={row.handle ?? ""}
                            onChange={(e) => update({ handle: e.target.value })}
                            placeholder="@handle"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            inputMode="numeric"
                            value={row.followers ?? ""}
                            onChange={(e) =>
                              update({
                                followers:
                                  Number(e.target.value.replace(/[^0-9]/g, "")) ||
                                  undefined,
                              })
                            }
                            placeholder={t("profile.channels.followers")}
                          />
                          <Input
                            inputMode="numeric"
                            value={row.avgViews ?? ""}
                            onChange={(e) =>
                              update({
                                avgViews:
                                  Number(e.target.value.replace(/[^0-9]/g, "")) ||
                                  undefined,
                              })
                            }
                            placeholder={t("agency.artistEditor.avgViews")}
                          />
                          <Input
                            inputMode="decimal"
                            value={row.engagementRate ?? ""}
                            onChange={(e) =>
                              update({
                                engagementRate:
                                  Number(e.target.value.replace(/[^0-9.]/g, "")) ||
                                  undefined,
                              })
                            }
                            placeholder={t("profile.channels.engagement")}
                          />
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              <div>
                <Label>{t("agency.artistEditor.externalLinks")}</Label>
                <RepeatRows<ArtistLink>
                  value={draft.links}
                  onChange={(v) => set("links", v)}
                  blank={() => ({ type: "homepage", url: "" })}
                  max={5}
                  addLabel={t("agency.artistEditor.addRow")}
                  renderRow={(row, update) => (
                    <div className="flex gap-2">
                      <select
                        value={row.type}
                        onChange={(e) => update({ type: e.target.value })}
                        className="h-10 w-32 shrink-0 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
                      >
                        {LINK_TYPES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={row.url}
                        onChange={(e) => update({ url: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  )}
                />
              </div>
            </FieldBlock>
          </div>

          {/* ── 7. 전문 스펙 — 선택한 카테고리에만 나타난다(유니온 1장, 카드 N장 아님) ── */}
          {specGroups.length > 0 && (
            <div id="blk-specialty">
              <FieldBlock
                title={t("agency.block.specialty")}
                hint={t("agency.block.specialtyHint")}
                summary={specGroups
                  .flatMap((g) => g.fields)
                  .map((f) => {
                    const v = draft.spec[f.key];
                    const txt = Array.isArray(v) ? v.join("/") : v == null ? "" : String(v);
                    return txt ? `${f.label} ${txt}` : "";
                  })
                  .filter(Boolean)
                  .join(" · ")}
                done={specGroups
                  .flatMap((g) => g.fields)
                  .some((f) => {
                    const v = draft.spec[f.key];
                    return Array.isArray(v) ? v.length > 0 : Boolean(v);
                  })}
                open={!!open.specialty}
                onToggle={() => toggle("specialty")}
              >
                {specGroups.map((g) => (
                  <div key={g.category} className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {t(`category.${g.category}`)}
                    </p>
                    {g.fields.map((f) => (
                      <div key={f.key}>
                        <Label>{f.label}</Label>
                        {f.ui === "chips" && (
                          <ChipMulti
                            options={f.options ?? []}
                            value={(draft.spec[f.key] as string[]) ?? []}
                            onChange={(v) => setSpec(f.key, v)}
                          />
                        )}
                        {f.ui === "segmented" && (
                          <Segmented
                            allowClear
                            value={draft.spec[f.key] as string | undefined}
                            onChange={(v) => setSpec(f.key, v)}
                            options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                          />
                        )}
                        {f.ui === "number" && (
                          <Input
                            inputMode="numeric"
                            value={(draft.spec[f.key] as number | undefined) ?? ""}
                            onChange={(e) =>
                              setSpec(
                                f.key,
                                Number(e.target.value.replace(/[^0-9]/g, "")) || undefined
                              )
                            }
                            className="w-32"
                          />
                        )}
                        {f.ui === "text" && (
                          <Input
                            value={(draft.spec[f.key] as string | undefined) ?? ""}
                            onChange={(e) => setSpec(f.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </FieldBlock>
            </div>
          )}

          {/* ── 7. 신체 정보 — 배우·모델·아이돌만 존재 ── */}
          {showHeight && (
            <div id="blk-body">
              <FieldBlock
                title={t("agency.block.body")}
                hint={t("agency.block.bodyHint")}
                summary={sum(
                  draft.heightCm && `${draft.heightCm}cm`,
                  draft.weightKg && `${draft.weightKg}kg`
                )}
                done={Boolean(draft.heightCm)}
                open={!!open.body}
                onToggle={() => toggle("body")}
              >
                <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
                  {t("agency.block.bodyNotice")}
                </p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="heightCm">{t("profile.spec.height")}</Label>
                    <Input
                      id="heightCm"
                      inputMode="numeric"
                      value={draft.heightCm ?? ""}
                      onChange={(e) =>
                        set("heightCm", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                      }
                      placeholder="165"
                    />
                  </div>
                  <VisibilityToggle
                    value={vis("height")}
                    onChange={(v) => setVis("height", v)}
                    labels={visLabels}
                  />
                </div>
                {showWeight && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="weightKg">{t("profile.spec.weight")}</Label>
                      <Input
                        id="weightKg"
                        inputMode="numeric"
                        value={draft.weightKg ?? ""}
                        onChange={(e) =>
                          set("weightKg", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                        }
                        placeholder="52"
                      />
                    </div>
                    <VisibilityToggle
                      value={vis("weight")}
                      onChange={(v) => setVis("weight", v)}
                      labels={visLabels}
                    />
                  </div>
                )}
              </FieldBlock>
            </div>
          )}

          {/* ── 8. 내부 운영값 — 공개되지 않음. 단가·분배율은 소속사가 정한다 ── */}
          {!isCreator && (
          <div id="blk-internal">
            <FieldBlock
              title={t("agency.block.internal")}
              hint={t("agency.block.internalHint")}
              summary={sum(draft.presetFee && `${draft.presetFee}만원`, draft.presetIncludes)}
              open={!!open.internal}
              onToggle={() => toggle("internal")}
            >
              <p className="rounded-lg bg-neutral-100 p-3 text-xs font-semibold text-neutral-600">
                {t("agency.block.internalNotice")}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="preset-fee">{t("agency.artistEditor.baseFee")}</Label>
                  <Input
                    id="preset-fee"
                    inputMode="numeric"
                    value={draft.presetFee ?? ""}
                    onChange={(e) =>
                      set("presetFee", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="preset-rate">{t("agency.artistEditor.agencyRate")}</Label>
                  <Input
                    id="preset-rate"
                    inputMode="numeric"
                    value={draft.agencyRate ?? ""}
                    onChange={(e) =>
                      set("agencyRate", Number(e.target.value.replace(/[^0-9]/g, "")) || undefined)
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="preset-includes">{t("agency.artistEditor.includes")}</Label>
                <Input
                  id="preset-includes"
                  value={draft.presetIncludes}
                  onChange={(e) => set("presetIncludes", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="preset-note">{t("agency.artistEditor.conditionNote")}</Label>
                <Textarea
                  id="preset-note"
                  rows={3}
                  value={draft.presetNote}
                  onChange={(e) => set("presetNote", e.target.value)}
                />
              </div>
            </FieldBlock>
          </div>
          )}

          {saveError && (
            <p className="text-sm font-semibold text-red-600">{saveError}</p>
          )}
        </div>

        {/* ── 완성도 사이드바 ── */}
        <div>
          <Card className="sticky top-24 p-6">
            <h3 className="text-sm font-bold text-neutral-500">
              {t("agency.artistEditor.completeness")}
            </h3>
            <p className="mt-2 text-3xl font-black tabular-nums">
              {score}
              <span className="text-base font-semibold text-neutral-400">%</span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <ul className="mt-4 space-y-1">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => jumpTo(item.block)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm hover:bg-neutral-50"
                  >
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                        item.done ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-300"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={item.done ? "text-neutral-700" : "text-neutral-400"}>
                      {t(`agency.completeness.${item.key}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
              {t("agency.artistEditor.completenessHint")}
            </p>
          </Card>
        </div>
      </div>

      {/* ── 저장 바 — 모바일에서도 항상 닿는다 ── */}
      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-3 border-t border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <Button size="lg" type="button" onClick={save} disabled={saving}>
          {saving ? t("agency.artistEditor.saving") : t("agency.artistEditor.saveCta")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          type="button"
          onClick={() => window.open(`/@${artist.slug}`, "_blank")}
        >
          {t("agency.artistEditor.previewPublic")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          type="button"
          onClick={() => window.open(`/p/${artist.slug}/kit`, "_blank")}
        >
          {t("profile.kitCta")}
        </Button>
      </div>
    </div>
  );
}
