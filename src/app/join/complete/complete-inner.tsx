"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, formatFollowers, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function CompleteInner() {
  const params = useSearchParams();
  const name = params.get("name") ?? "신규 크리에이터";
  const slug = params.get("slug") ?? "me";
  const category = (params.get("category") as ArtistCategory) ?? "influencer";
  const followers = Number(params.get("followers") ?? 0);

  const [copied, setCopied] = useState(false);
  const url = `https://xong.co.kr/@${slug}`;

  const copy = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* 히어로 */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500 text-white">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          {name}님, 환영해요!
        </h1>
        <p className="mt-2 text-neutral-500">
          {CATEGORY_LABELS[category]}
          {followers > 0 && ` · 팔로워 ${formatFollowers(followers)}`}
        </p>
      </div>

      {/* 공유 링크 */}
      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3 text-xs font-bold text-neutral-500">
          당신의 xong 링크
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="min-w-0 flex-1 truncate font-black text-neutral-900">
              {url}
            </span>
            <button
              onClick={copy}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                copied
                  ? "bg-neutral-900 text-white"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> 복사됨
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> 복사
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            이 링크를 인스타 바이오·트위터·카톡 프로필에 붙여두면 브랜드가 대행사
            거치지 않고 바로 연락해요.
          </p>
        </div>
      </Card>

      {/* 다음 액션 */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={`https://www.instagram.com/`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-900"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <InstagramIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">인스타 바이오에 붙이기</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              1분이면 첫 섭외를 받을 준비 완료
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-neutral-900" />
        </a>
        <button className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            <MessageCircle className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">카톡 프로필에 붙이기</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              지인 브랜드가 카톡으로 문의 가능
            </p>
          </div>
        </button>
      </div>

      {/* 미리보기 */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-bold text-neutral-500">
          지금 당신의 프로필은 이렇게 보여요
        </p>
        <Link
          href={`/p/haneul`}
          className="mt-3 flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-neutral-200 transition-colors hover:ring-neutral-900"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-black text-white">
            {name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{name}</p>
            <p className="text-xs text-neutral-500">
              @{slug} · {CATEGORY_LABELS[category]}
            </p>
          </div>
          <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
            공개 중
          </span>
        </Link>
      </div>

      {/* 대시보드 CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/me"
          className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          내 대시보드 열기 →
        </Link>
        <p className="mt-3 text-xs text-neutral-400">
          섭외 요청·정산·일정을 여기서 관리해요
        </p>
      </div>
    </div>
  );
}
