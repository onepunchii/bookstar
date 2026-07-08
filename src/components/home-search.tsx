"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARTISTS } from "@/lib/mock-data";
import { CATEGORY_LABELS, formatFollowers, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Search, Sparkles, TrendingUp } from "lucide-react";

const KEYWORDS = ["축제", "광고", "MC", "뷰티", "유튜브", "팬미팅"];

export function HomeSearch() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return ARTISTS.filter((a) =>
      [a.name, a.agencyName, a.tagline, ...a.tags].some((s) =>
        s.toLowerCase().includes(term)
      )
    ).slice(0, 5);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (term: string) => {
    router.push(`/artists?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      {/* 검색 + 드롭다운 */}
      <div ref={ref} className="relative flex-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) go(q.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="아티스트·소속사·키워드 검색"
            className="glass premium-ease h-14 w-full rounded-full py-4 pl-13 pr-5 text-base text-white outline-none placeholder:text-white/35 focus:border-brand-500/50"
          />
        </form>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl bg-black/70 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl duration-200 animate-in fade-in slide-in-from-top-1">
            {results.length > 0 ? (
              <ul className="p-2">
                {results.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/artists/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-black text-white/40">
                        {a.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-white">
                          {a.name}
                        </span>
                        <span className="block truncate text-xs text-white/45">
                          {CATEGORY_LABELS[a.category]} · 팔로워{" "}
                          {formatFollowers(a.followers)}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : q.trim() ? (
              <button
                onClick={() => go(q.trim())}
                className="flex w-full items-center gap-2 px-4 py-3.5 text-left text-sm text-white/70 hover:bg-white/[0.05]"
              >
                <Search className="h-4 w-4 text-white/40" />
                <span className="font-semibold text-white">{q}</span> 전체
                결과 보기
              </button>
            ) : (
              <div className="p-3">
                <p className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/35">
                  <TrendingUp className="h-3 w-3" /> 인기 키워드
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {KEYWORDS.map((k) => (
                    <button
                      key={k}
                      onClick={() => go(k)}
                      className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-white/35">
                  카테고리
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {(Object.keys(CATEGORY_LABELS) as ArtistCategory[])
                    .slice(0, 5)
                    .map((c) => (
                      <Link
                        key={c}
                        href={`/artists?category=${c}`}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-brand-500/20 hover:text-brand-300"
                      >
                        {CATEGORY_LABELS[c]}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI 캐스팅 버튼 */}
      <Link
        href="/recommend"
        className="premium-ease flex h-14 shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 hover:brand-glow sm:px-6"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">AI 캐스팅</span>
        <span className="sm:hidden">AI</span>
      </Link>
    </div>
  );
}
