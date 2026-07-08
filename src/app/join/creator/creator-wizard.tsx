"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { fileToWebP, type WebPResult } from "@/lib/image";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
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

const STEP_LABELS = ["기본 정보", "SNS 연동", "요금·이미지", "프로필 사진", "완료"];

export function CreatorWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ArtistCategory>("influencer");
  const [gender, setGender] = useState<"male" | "female" | "group">("female");
  const [region, setRegion] = useState("서울");

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

  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
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
      setSaveError("등록에 실패했어요. 다시 시도해주세요.");
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
              {String(i + 1).padStart(2, "0")} · {label}
            </span>
          </div>
        ))}
      </div>

      {/* 스텝 콘텐츠 */}
      <Card className="p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">기본 정보</h2>
              <p className="mt-1 text-sm text-neutral-500">
                브랜드가 검색 결과에서 볼 정보예요
              </p>
            </div>
            <div>
              <Label htmlFor="w-name">활동명</Label>
              <Input
                id="w-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김하늘, HANEUL, 하늘냥"
              />
            </div>
            <div>
              <Label>카테고리</Label>
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
              <Label>성별</Label>
              <div className="flex gap-2">
                {(
                  [
                    ["female", "여성"],
                    ["male", "남성"],
                    ["group", "팀·그룹"],
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
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="w-region">활동 지역</Label>
              <Input
                id="w-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울, 부산, 전국"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">SNS 연동</h2>
              <p className="mt-1 text-sm text-neutral-500">
                인스타 핸들이 곧 당신의 xong 링크가 돼요
              </p>
            </div>
            <div>
              <Label htmlFor="w-handle">인스타그램 핸들</Label>
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
                  당신의 xong 링크:{" "}
                  <span className="font-semibold text-neutral-900">
                    xong.co.kr/@{handle.toLowerCase()}
                  </span>
                </p>
              )}
            </div>
            {snsLoading && (
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                인스타 팔로워를 확인하는 중…
              </div>
            )}
            {snsResult && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-500" />
                  <span className="text-sm font-bold text-brand-700">
                    연동 완료
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-700">
                  팔로워{" "}
                  <span className="text-lg font-black text-brand-600">
                    {(snsResult.followers / 10000).toFixed(1)}만
                  </span>
                  {snsResult.verified && (
                    <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      인플루언서 뱃지
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="w-yt">유튜브 채널 (선택)</Label>
              <Input
                id="w-yt"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="채널 URL 또는 @handle"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">요금 · 이미지</h2>
              <p className="mt-1 text-sm text-neutral-500">
                브랜드가 매칭 알고리즘에 사용해요. 정확한 금액은 공개되지
                않아요
              </p>
            </div>
            <div>
              <Label htmlFor="w-fee">기본 출연료 (만원)</Label>
              <Input
                id="w-fee"
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                placeholder="예: 500"
              />
            </div>
            <div>
              <Label htmlFor="w-incl">기본 포함 항목</Label>
              <Textarea
                id="w-incl"
                rows={2}
                value={includes}
                onChange={(e) => setIncludes(e.target.value)}
                placeholder="예: 영상 1편 (10분) + 인스타 스토리 2회"
              />
            </div>
            <div>
              <Label>이미지 태그</Label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      tags.includes(t)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-neutral-200 text-neutral-600 hover:border-brand-500"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                {tags.length > 0
                  ? `${tags.length}개 선택 · 브랜드 매칭에 사용돼요`
                  : "3개 이상 선택하면 매칭도 UP"}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">프로필 사진</h2>
              <p className="mt-1 text-sm text-neutral-500">
                업로드 즉시 WebP로 변환돼 용량을 확 줄여드려요 (선택)
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
                    alt="프로필 미리보기"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white">
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
              ) : converting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                  <span className="mt-2 text-sm">변환 중…</span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8" />
                  <span className="mt-2 text-sm font-semibold">
                    프로필 사진 업로드
                  </span>
                  <span className="mt-1 text-xs">
                    JPG · PNG · HEIC · 3:4 권장
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
                준비 끝! <span className="text-brand-500">🎉</span>
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                아래를 확인하고 &lsquo;공개하기&rsquo;를 누르면 완료돼요
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-neutral-50 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">활동명</span>
                <span className="font-bold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">카테고리</span>
                <span className="font-bold">{CATEGORY_LABELS[category]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">인스타 핸들</span>
                <span className="font-bold">@{handle.toLowerCase()}</span>
              </div>
              {snsResult && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">팔로워</span>
                  <span className="font-bold text-brand-600">
                    {(snsResult.followers / 10000).toFixed(1)}만
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">기본 출연료</span>
                <span className="font-bold">
                  {Number(baseFee).toLocaleString()}만원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">이미지 태그</span>
                <span className="max-w-[60%] text-right font-bold">
                  {tags.length > 0 ? tags.join(" · ") : "없음"}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                <Sparkles className="h-4 w-4" /> 발급될 링크
              </p>
              <p className="mt-1 text-sm font-black text-neutral-900">
                xong.co.kr/@{handle.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                인스타 바이오·트위터·카톡 프로필에 붙여두세요
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
            ← 이전
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
            다음 <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            {saveError && (
              <span className="text-xs font-semibold text-red-600">
                {saveError}
              </span>
            )}
            <Button size="lg" disabled={saving} onClick={finalize}>
              {saving ? "등록 중…" : "공개하기"} <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
