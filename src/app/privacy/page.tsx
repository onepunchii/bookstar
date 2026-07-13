import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { SITE } from "@/lib/site";

// 개인정보처리방침 — 스토어(Play·App Store) 제출 필수 페이지.
export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "xong 개인정보처리방침",
  alternates: { canonical: `${SITE.url}/privacy` },
};

const UPDATED = "2026-07-13";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-[720px] items-center px-5">
          <Link href="/" aria-label="xong 홈으로">
            <Wordmark height={18} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-5 py-10 text-[15px] leading-relaxed">
        <h1 className="mb-2 text-[26px] font-black">개인정보처리방침</h1>
        <p className="mb-8 text-neutral-500">시행일: {UPDATED}</p>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">1. 수집하는 정보</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>계정 정보: 카카오 로그인 시 닉네임(프로필 이름)</li>
            <li>
              프로필 정보(선택): 회사명·소속사명·담당자명·연락처·이메일 등
              이용자가 직접 입력한 정보
            </li>
            <li>
              소속사 인증 정보(선택): 사업자등록번호, 사업자등록증 등 인증
              서류
            </li>
            <li>
              서비스 이용 정보: 섭외 요청 내용, 협의 메시지, 견적, 일정 등록
              내역
            </li>
            <li>
              자동 수집: 접속 기록, 기기·브라우저 정보(서비스 안정화·오류 진단
              목적)
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">2. 이용 목적</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>광고주와 소속사·크리에이터 간 섭외 연결 및 협의 기능 제공</li>
            <li>소속사 인증 심사(허위·위장 계정 방지)</li>
            <li>새 메시지·견적 등 서비스 알림 제공</li>
            <li>서비스 개선 및 오류 대응</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">3. 보관 및 파기</h2>
          <p>
            개인정보는 수집 목적 달성 시 지체 없이 파기합니다. 회원 탈퇴(계정
            삭제) 시 계정 정보와 기록은 즉시 삭제되며, 관계 법령에 따라 보존이
            필요한 정보는 해당 기간 동안만 보관합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">
            4. 제3자 제공 및 처리 위탁
          </h2>
          <p>
            개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 섭외 협의
            과정에서 이용자가 입력한 요청 정보(회사명·행사 정보 등)는 협의
            상대방(해당 소속사 또는 광고주)에게 표시됩니다. 서비스 운영을 위해
            다음 처리 위탁이 이루어집니다.
          </p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            <li>Vercel Inc. — 서비스 호스팅</li>
            <li>Neon Inc. — 데이터베이스 운영</li>
            <li>주식회사 카카오 — 소셜 로그인(카카오 로그인)</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">5. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보 열람·정정·삭제(계정 삭제 포함)를
            요청할 수 있습니다. 아래 문의처를 통해 요청하시면 지체 없이
            처리합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">6. 문의처</h2>
          <p>
            개인정보 관련 문의:{" "}
            <a
              className="font-semibold text-brand-600 underline"
              href="mailto:petudy@kakao.com"
            >
              petudy@kakao.com
            </a>
          </p>
        </section>

        <p className="text-[13px] text-neutral-500">
          본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 개정 시 본
          페이지에 고지합니다.
        </p>

        <p className="mt-6 text-[13px] text-neutral-400">
          <Link href="/terms" className="underline">
            이용약관 보기
          </Link>
        </p>
      </div>
    </div>
  );
}
