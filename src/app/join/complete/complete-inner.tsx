"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { formatFollowers, type ArtistCategory } from "@/lib/types";
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
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const name = params.get("name") ?? t("join.complete.defaultName");
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
          {t("join.complete.welcome", { name })}
        </h1>
        <p className="mt-2 text-neutral-500">
          {t(`category.${category}`)}
          {followers > 0 &&
            t("join.complete.followers", { count: formatFollowers(followers, locale) })}
        </p>
      </div>

      {/* 공유 링크 */}
      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3 text-xs font-bold text-neutral-500">
          {t("join.complete.linkLabel")}
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
                  <Check className="h-3.5 w-3.5" /> {t("join.complete.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> {t("join.complete.copy")}
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {t("join.complete.linkHint")}
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
            <p className="text-sm font-bold">{t("join.complete.instaTitle")}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t("join.complete.instaDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-neutral-900" />
        </a>
        <button className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            <MessageCircle className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{t("join.complete.kakaoTitle")}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t("join.complete.kakaoDesc")}
            </p>
          </div>
        </button>
      </div>

      {/* 미리보기 */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-bold text-neutral-500">
          {t("join.complete.previewLabel")}
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
              @{slug} · {t(`category.${category}`)}
            </p>
          </div>
          <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
            {t("join.complete.publicBadge")}
          </span>
        </Link>
      </div>

      {/* 대시보드 CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/me"
          className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
        >
          {t("join.complete.dashboardCta")} →
        </Link>
        <p className="mt-3 text-xs text-neutral-400">
          {t("join.complete.dashboardHint")}
        </p>
      </div>
    </div>
  );
}
