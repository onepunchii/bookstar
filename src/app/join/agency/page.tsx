import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { Building2, Mail, Phone, Sparkles } from "lucide-react";

export const metadata = {
  title: "소속사 등록 · xong",
  description:
    "소속 아티스트를 등록하고 섭외 요청을 한 곳에서 관리하세요. 등록 즉시 공개 프로필이 검색에 노출됩니다. 매칭 수수료 0%.",
  alternates: { canonical: "/join/agency" },
};

export default function AgencyJoinPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/join" aria-label="가입 처음으로">
            <Wordmark height={20} />
          </Link>
          <Link
            href="/join/creator"
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-900"
          >
            개인 크리에이터로 등록 →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-black tracking-tight">
          소속사·MCN 입점 문의
        </h1>
        <p className="mt-3 text-center leading-relaxed text-neutral-600">
          소속 아티스트 다수를 xong 소속사 센터로 관리하시려면 담당자와의
          짧은 미팅을 거쳐 초대 링크를 발급해드려요.
          <br />
          검수·시연 포함 평균{" "}
          <span className="font-bold text-neutral-900">2 영업일</span> 소요됩니다.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="mailto:hello@xong.co.kr?subject=xong%20%EC%86%8C%EC%86%8D%EC%82%AC%20%EC%9E%85%EC%A0%90%20%EB%AC%B8%EC%9D%98"
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Mail className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">이메일 문의</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                hello@xong.co.kr
              </p>
            </div>
          </a>
          <a
            href="tel:+8225551234"
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Phone className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">전화 문의</p>
              <p className="mt-0.5 text-xs text-neutral-500">02-555-1234</p>
            </div>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
            <Sparkles className="h-4 w-4 text-brand-500" /> 이런 소속사에게
            추천해요
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
            <li>· 소속 아티스트 3팀 이상, 카톡·엑셀로 일정 관리 중</li>
            <li>· 대행사 거치지 않는 직거래 채널이 필요한 곳</li>
            <li>· 매니저별 담당 아티스트 분리·정산 자동화가 필요한 곳</li>
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          시연을 먼저 보시겠어요?{" "}
          <Link href="/" className="font-semibold text-neutral-900">
            데모 대시보드 열기
          </Link>
        </p>
      </div>
    </div>
  );
}
