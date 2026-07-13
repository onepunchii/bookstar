import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { SITE } from "@/lib/site";

// 계정 삭제 안내 — Google Play 데이터 보안 요건(계정 삭제 URL) 필수 페이지.
export const metadata: Metadata = {
  title: "계정 삭제 안내",
  description: "XONG(쏭) 계정 및 데이터 삭제 요청 방법 안내",
  alternates: { canonical: `${SITE.url}/account-delete` },
};

const UPDATED = "2026-07-14";

export default function AccountDeletePage() {
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
        <h1 className="mb-2 text-[26px] font-black">계정 삭제 안내</h1>
        <p className="mb-8 text-neutral-500">최종 업데이트: {UPDATED}</p>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">1. 대상 서비스</h2>
          <p>
            본 안내는 <strong>XONG(쏭)</strong> 앱 및 웹 서비스(xong.co.kr)의
            계정 삭제(회원 탈퇴)와 관련 데이터 삭제 절차를 설명합니다. XONG(쏭)
            이용자는 누구나 언제든지 계정 삭제를 요청할 수 있습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">2. 계정 삭제 요청 방법</h2>
          <div
            className="flex flex-col gap-2 rounded-2xl p-4"
            style={{
              border: "1px solid rgba(255,90,0,0.45)",
              background: "rgba(255,90,0,0.08)",
            }}
          >
            <p className="font-bold">
              카카오 로그인 사용자는 아래 절차로 계정 삭제를 요청할 수
              있습니다.
            </p>
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              <li>
                <a
                  className="font-semibold text-brand-600 underline"
                  href="mailto:petudy@kakao.com?subject=%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD"
                >
                  petudy@kakao.com
                </a>
                으로 제목에 <strong>&ldquo;계정 삭제 요청&rdquo;</strong>을
                적어 메일을 보냅니다.
              </li>
              <li>
                본문에 <strong>가입 시 사용한 카카오 닉네임</strong>을
                적어주세요. (본인 계정 확인용)
              </li>
              <li>
                확인 후 <strong>영업일 기준 3일 이내</strong>에 계정과 관련
                데이터를 삭제하고, 처리 완료를 회신해 드립니다.
              </li>
            </ol>
          </div>
          <p className="mt-2 text-neutral-500">
            계정 전체 삭제 대신 일부 데이터(예: 프로필 정보, 특정 메시지)의
            삭제만 원하시는 경우에도 같은 방법으로 요청하실 수 있습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">3. 삭제되는 데이터</h2>
          <p>계정 삭제 시 다음 데이터가 삭제됩니다.</p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            <li>계정 정보: 카카오 로그인 연결 정보, 닉네임(프로필 이름)</li>
            <li>
              프로필 정보: 회사명·소속사명·담당자명·연락처·이메일 등 이용자가
              입력한 정보와 인증 서류
            </li>
            <li>
              서비스 이용 기록: 섭외 요청 내용, 협의 메시지, 견적, 일정 등록
              이력
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">
            4. 법령에 따른 보존 예외
          </h2>
          <p>
            다음 정보는 관계 법령에 따라 명시된 기간 동안 별도 분리 보관 후
            파기하며, 다른 목적으로 이용하지 않습니다.
          </p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            <li>
              계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의
              소비자보호에 관한 법률)
            </li>
            <li>
              대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의
              소비자보호에 관한 법률)
            </li>
            <li>
              소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래
              등에서의 소비자보호에 관한 법률)
            </li>
            <li>서비스 접속 기록(로그): 3개월 (통신비밀보호법)</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">5. 유의 사항</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>삭제된 계정과 데이터는 복구할 수 없습니다.</li>
            <li>
              진행 중인 섭외 협의가 있는 경우, 삭제 시 상대방과의 협의 내역에
              더 이상 접근할 수 없습니다.
            </li>
            <li>
              카카오 계정 자체는 삭제되지 않으며, XONG(쏭)과의 연결만
              해제됩니다.
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">6. 문의처</h2>
          <p>
            계정 삭제 및 개인정보 관련 문의:{" "}
            <a
              className="font-semibold text-brand-600 underline"
              href="mailto:petudy@kakao.com"
            >
              petudy@kakao.com
            </a>
          </p>
        </section>

        <p className="text-[13px] text-neutral-500">
          개인정보의 처리에 관한 자세한 내용은 개인정보처리방침을
          확인해주세요.
        </p>

        <p className="mt-6 flex gap-3 text-[13px] text-neutral-400">
          <Link href="/privacy" className="underline">
            개인정보처리방침 보기
          </Link>
          <Link href="/terms" className="underline">
            이용약관 보기
          </Link>
        </p>
      </div>
    </div>
  );
}
