import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "xong 가입 · eXperience ON",
  description:
    "브랜드가 당신을 직접 찾아오게 하세요. 크리에이터·인플루언서·소속사를 위한 가장 빠른 부킹 채널.",
};

export default function JoinLandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="xong 홈으로">
            <Wordmark height={22} />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          >
            둘러보기 →
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="border-b border-neutral-100 bg-gradient-to-b from-brand-50/40 to-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
            <Zap className="h-3 w-3" /> BETA · 초대 코드 없이 즉시 가입
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            브랜드가 당신을{" "}
            <span className="text-brand-500">직접</span> 찾아오게
            하세요
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-neutral-600">
            프로필을 만들면 3분 안에 나만의 섭외 링크가 발급돼요.
            인스타 바이오에 붙여두면 브랜드가 대행사를 거치지 않고 바로
            연락합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> 브로커 없이
              직거래
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> 견적·계약·정산
              한 곳
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> 가입 무료
            </span>
          </div>
        </div>
      </section>

      {/* 페르소나 선택 */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-sm font-bold text-neutral-500">
          어떤 자격으로 가입하시겠어요?
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 크리에이터 */}
          <Link
            href="/join/creator"
            className="group relative overflow-hidden rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 p-7 text-white transition-transform hover:-translate-y-0.5"
          >
            <span className="absolute right-4 top-4 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-brand-600">
              추천
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-black">
              개인 크리에이터
              <br />
              인플루언서 · 유튜버
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              소속사 없이 활동 중이신가요? 인스타·유튜브 채널만 있으면
              돼요. 프로필 만들고 링크만 걸어두면 자동으로 브랜드가
              찾아옵니다.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm">
              {[
                "3분 만에 나만의 섭외 링크 발급",
                "SNS 연동으로 팔로워 자동 표시",
                "요금·조건 직접 설정 · 수수료 저렴",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-white/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold">
              크리에이터로 시작하기 <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {/* 소속사 */}
          <Link
            href="/join/agency"
            className="group rounded-3xl border-2 border-neutral-200 bg-white p-7 transition-colors hover:border-neutral-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-black">
              소속사 · MCN
              <br />
              엔터테인먼트사
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              여러 아티스트를 관리하시나요? xong 소속사 센터로 프로필·일정·
              섭외·정산을 한 곳에서 처리하세요. 카톡과 엑셀에서 벗어나요.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-neutral-600">
              {[
                "아티스트 로스터·일정·매니저 스코프",
                "인박스 · 견적 프리셋 · 홀드 자동화",
                "데일리 시트 · 정산 · 서류함까지",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-neutral-900">
              소속사로 시작하기 <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          이미 xong를 쓰고 계신가요?{" "}
          <Link href="/" className="font-semibold text-neutral-900">
            로그인
          </Link>
        </p>
      </section>
    </div>
  );
}
