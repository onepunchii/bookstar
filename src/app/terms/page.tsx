import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { SITE } from "@/lib/site";

// 이용약관 — 스토어(Play·App Store) 제출 필수 페이지. UGC 무관용 원칙 포함(App Store 1.2 대비).
export const metadata: Metadata = {
  title: "이용약관",
  description: "xong 이용약관",
  alternates: { canonical: `${SITE.url}/terms` },
};

const UPDATED = "2026-07-13";

export default function TermsPage() {
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
        <h1 className="mb-2 text-[26px] font-black">이용약관</h1>
        <p className="mb-8 text-neutral-500">시행일: {UPDATED}</p>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">1. 목적</h2>
          <p>
            본 약관은 xong(이하 &ldquo;서비스&rdquo;)의 이용 조건과 절차,
            이용자와 운영자의 권리·의무 및 책임 사항을 정하는 것을 목적으로
            합니다. 서비스를 이용하는 모든 이용자는 본 약관에 동의한 것으로
            봅니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">2. 서비스 내용</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>연예인·인플루언서 공개 프로필 발행 및 검색</li>
            <li>광고주와 소속사·크리에이터 간 섭외 요청·협의 채팅·견적 기능</li>
            <li>소속사 콘솔(일정·인박스·정산 등 운영 도구) 제공</li>
            <li>오픈 캠페인 등 이용자 간 연결 기능</li>
            <li>기타 운영자가 추가·개선하는 부가 서비스</li>
          </ul>
          <p className="mt-1">
            서비스가 제공하는 섭외가 범위·응답률 등 정보는 참고용이며, 실제
            계약·거래 판단의 최종 책임은 이용자에게 있습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">3. 계정과 이용자의 의무</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              이용자는 정확한 정보로 계정을 관리해야 하며, 계정의 관리 책임은
              이용자 본인에게 있습니다.
            </li>
            <li>타인의 계정을 도용하거나 계정을 양도·대여할 수 없습니다.</li>
            <li>
              이용자는 서비스 이용 시 관계 법령과 본 약관, 공지사항을 준수해야
              합니다.
            </li>
            <li>
              서비스의 정상적인 운영을 방해하는 행위(자동화 수집, 부정 접근
              등)를 해서는 안 됩니다.
            </li>
            <li>
              이용자는 언제든지 계정 삭제(탈퇴)를 요청할 수 있으며, 아래
              문의처를 통해 처리됩니다.
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">
            4. 콘텐츠 및 커뮤니티 원칙 (무관용)
          </h2>
          <div
            className="flex flex-col gap-1 rounded-2xl p-4"
            style={{
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.08)",
            }}
          >
            <p className="font-bold">
              xong은 불쾌감을 주는 콘텐츠(objectionable content)와 악성
              사용자(abusive users)를 일절 용납하지 않습니다.
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>
                욕설·혐오·차별·음란물·불법 정보·스팸 등 불쾌감을 주는 콘텐츠의
                게시를 금지합니다.
              </li>
              <li>
                프로필·협의 메시지 등 이용자 생성 콘텐츠는 앱 안에서 즉시
                신고할 수 있습니다.
              </li>
              <li>
                악성 사용자는 차단할 수 있으며, 차단한 사용자와는 더 이상
                대화할 수 없습니다.
              </li>
              <li>
                <strong>
                  신고된 콘텐츠는 24시간 이내에 검토하여 위반 시 삭제합니다.
                </strong>
              </li>
              <li>
                원칙을 위반한 사용자는 사전 통지 없이 이용이 제한되거나
                서비스에서 퇴출될 수 있습니다.
              </li>
              <li>
                본 약관에 동의함으로써 이용자는 위 원칙을 준수할 것에
                동의합니다.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">5. 게시물의 관리</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              이용자가 작성한 프로필·메시지 등 게시물의 권리와 책임은
              작성자에게 있습니다.
            </li>
            <li>
              운영자는 게시물이 법령 또는 본 약관(특히 제4조)에 위반되는 경우
              사전 통지 없이 삭제·비공개 등의 조치를 할 수 있습니다.
            </li>
            <li>이용자는 자신의 게시물을 언제든지 수정·삭제할 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">6. 서비스의 변경·중단</h2>
          <p>
            운영자는 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
            중대한 변경·중단이 예정된 경우 서비스 내 공지 등으로 사전에
            알립니다. 무료로 제공되는 서비스의 변경·중단에 대해 운영자는 별도의
            보상을 하지 않습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">7. 면책</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              천재지변, 통신 장애 등 불가항력으로 서비스를 제공할 수 없는 경우
              책임이 면제됩니다.
            </li>
            <li>
              섭외가 범위·응답률 등 제공 정보의 정확성을 보증하지 않으며, 이를
              근거로 한 이용자의 판단·거래 결과에 대해 책임지지 않습니다.
            </li>
            <li>
              섭외·출연 계약 등 이용자 간 거래에서 발생한 분쟁은 당사자 간에
              해결하는 것을 원칙으로 하며, 운영자는 거래의 당사자가 아닙니다.
            </li>
            <li>
              이용자의 귀책 사유로 발생한 손해에 대해 운영자는 책임지지
              않습니다.
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-[18px] font-bold">8. 문의처</h2>
          <p>
            약관 및 서비스 관련 문의:{" "}
            <a
              className="font-semibold text-brand-600 underline"
              href="mailto:petudy@kakao.com"
            >
              petudy@kakao.com
            </a>
          </p>
        </section>

        <p className="text-[13px] text-neutral-500">
          본 약관은 법령·서비스 변경에 따라 개정될 수 있으며, 개정 시 본
          페이지에 고지합니다.
        </p>

        <p className="mt-6 text-[13px] text-neutral-400">
          <Link href="/privacy" className="underline">
            개인정보처리방침 보기
          </Link>
        </p>
      </div>
    </div>
  );
}
