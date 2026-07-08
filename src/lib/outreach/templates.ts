// 이메일 전용 "미니 원페이저" — 클릭 없이 본문에서 핵심이 다 보이는 스크롤형.
// 이메일 클라이언트(지메일·네이버·아웃룩)는 CSS 대부분을 제거하므로
// 테이블 레이아웃 + 인라인 스타일만 사용. 스크린샷은 배포 사이트의 /ir/*.jpg 참조.
// 법적 요건: 제목 (광고) 표기 + 본문 수신거부 링크 (정보통신망법).

import { siteUrl } from "./resend";

export type OutreachSegment = "agency" | "creator" | "company";

interface TemplateInput {
  name: string | null;
  org: string | null;
  unsubToken: string;
  reminder?: boolean;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "#FF5A00";
const INK = "#111111";
const MUTED = "#666666";

interface SegmentCopy {
  subject: string;
  reminderSubject: string;
  hook: string;
  intro: (who: string) => string;
  bullets: { label: string; desc: string }[];
  shots: { file: string; caption: string }[];
  ctaLabel: string;
  ctaPath: string;
  closing: string;
}

const COPY: Record<OutreachSegment, SegmentCopy> = {
  agency: {
    subject:
      "소속 아티스트 섭외 문의, 수수료 0%로 직접 받는 창구가 생겼습니다",
    reminderSubject: "혹시 놓치셨을까 봐요 — 수수료 0% 직거래 창구, 3분이면 확인됩니다",
    hook: "광고주가 직접 찾아옵니다.\n성사돼도 수수료는 0원입니다",
    intro: (who) =>
      `${who} 안녕하세요, 섭외 플랫폼 <b>XONG</b>입니다.<br><br>대학축제·기업행사·지자체 광고주들이 브로커 거품(평균 38%) 없이 소속사와 <b>직접 거래할 창구</b>를 찾고 있습니다. XONG에 아티스트 프로필을 올리면 섭외 문의가 예산·날짜와 함께 직접 들어오고, <b>성사돼도 저희는 한 푼도 떼지 않습니다.</b>`,
    bullets: [
      {
        label: "광고주 직접 매칭 — 새 매출 채널",
        desc: "축제·행사·광고 수요가 프로필을 보고 직접 문의합니다. 중간 대행사에 뺏기던 물량이 공식 창구로 들어옵니다.",
      },
      {
        label: "매칭 수수료 0% — 출연료 전액이 소속사 몫",
        desc: "타 플랫폼은 성사금의 10%를 뗍니다. XONG는 0%. 저희는 브로커가 아니라 인프라입니다.",
      },
      {
        label: "화제성 데이터가 단가를 방어",
        desc: "뉴스·검색·유튜브 실데이터가 프로필에 붙어 \"왜 이 가격인지\"를 광고주에게 증명합니다.",
      },
      {
        label: "운영은 덤 — 매니저팀 업무 자동화",
        desc: "데일리 시트 카톡 전파, 더블부킹 자동 차단, 원천징수 3.3% 정산까지. 5팀까지 영구 무료.",
      },
    ],
    shots: [
      {
        file: "artist-detail.jpg",
        caption: "광고주에게 이렇게 보입니다 — 화제성 데이터·섭외가·섭외 요청 버튼",
      },
      {
        file: "agency-inbox.jpg",
        caption: "문의는 이렇게 들어옵니다 — 예산·날짜가 정리된 요청 카드",
      },
    ],
    ctaLabel: "3분 소개 보기",
    ctaPath: "/for/agency",
    closing:
      "아티스트 프로필 등록은 무료이고, 첫 세팅은 저희가 도와드립니다. 다음 주 중 10분 통화 가능하시면 이 메일에 회신만 주세요 — 데모 계정을 바로 열어드리겠습니다.",
  },
  creator: {
    subject: "브랜드·행사 섭외, 중간에 떼이지 말고 전부 받으세요 — 수수료 0%",
    reminderSubject: "수수료 0% 섭외 페이지, 3초면 생깁니다",
    hook: "섭외 수익, 중간에서 떼이지 말고\n전부 가져가세요",
    intro: (who) =>
      `${who} 안녕하세요, 섭외 플랫폼 <b>XONG</b>입니다.<br><br>행사·브랜드 광고주들이 대행사 마진 없이 크리에이터와 <b>직접 거래할 창구</b>를 찾고 있습니다. XONG에 무료 섭외 페이지를 만들면 광고주 문의가 예산과 함께 직접 들어오고, <b>성사돼도 수수료 0% — 출연료는 전부 내 것</b>입니다.`,
    bullets: [
      {
        label: "광고주 직접 매칭 — 새 수익 채널",
        desc: "기업 행사·브랜드 협업 수요가 내 페이지를 보고 직접 문의합니다. MCN·대행 마진 없이.",
      },
      {
        label: "수수료 0% · 평생 무료",
        desc: "가입비도, 성사 수수료도 없습니다. 100만원 섭외면 100만원이 내 통장에. 저희는 대형 기획사 구독으로 법니다.",
      },
      {
        label: "섭외가 공개로 단가 방어",
        desc: "희망 섭외가 범위를 공개하면 후려치기와 예산 없는 간보기 문의가 애초에 안 옵니다 (예산·날짜 필수 입력).",
      },
      {
        label: "정체불명 업체 자동 필터",
        desc: "사업자 미인증 주최자는 경고 배지. 협찬 스팸에 파묻히던 지메일과는 다릅니다.",
      },
    ],
    shots: [
      {
        file: "artist-detail.jpg",
        caption: "광고주에게 이렇게 보입니다 — 구독자·화제성·섭외가 공개",
      },
      {
        file: "agency-inbox.jpg",
        caption: "문의는 이렇게 들어옵니다 — 예산·날짜가 정리된 요청 카드",
      },
    ],
    ctaLabel: "무료로 내 섭외 페이지 만들기",
    ctaPath: "/for/creator",
    closing:
      "유튜브 정보란에 링크 하나 거는 일이라 손해 볼 게 없습니다. 카카오 로그인 3초면 페이지가 생깁니다.",
  },
  company: {
    subject: "지난 행사 섭외 견적서, 실출연료는 얼마였는지 아세요?",
    reminderSubject: "38% 거품 없는 섭외 견적, 비교만 해보세요",
    hook: "그 견적, 실출연료는 얼마였을까요?",
    intro: (who) =>
      `${who} 안녕하세요, 섭외 플랫폼 <b>XONG</b>입니다.<br><br>연예인 섭외 견적에는 평균 <b>38%의 다단계 마진</b>이 붙습니다. 광고대행사 +15%, 행사대행사 +20%, 에이전시 +10% — 실출연료 3,500만원짜리가 5,313만원이 되는 구조입니다.`,
    bullets: [
      {
        label: "소속사 공식 창구와 직거래",
        desc: "인증 소속사 배지로 사칭·이중계약 차단. 브로커가 낄 자리가 없습니다.",
      },
      {
        label: "섭외가 범위 사전 공개",
        desc: "예산 안 맞으면 애초에 패스. 전화 돌리며 며칠 기다릴 필요가 없습니다.",
      },
      {
        label: "실시간 가능일정 캘린더",
        desc: "가능/불가를 바로 확인하고 표준 브리프로 요청 — 협의는 전부 기록으로 남습니다.",
      },
      {
        label: "광고주 완전 무료 · 수수료 0%",
        desc: "가입비도 수수료도 없습니다. 견적 비교만 해봐도 손해가 없습니다.",
      },
    ],
    shots: [
      { file: "artists.jpg", caption: "아티스트 찾기 — 예산 필터·섭외가 공개" },
      { file: "artist-detail.jpg", caption: "상세 — 화제성 실데이터로 품의 근거 확보" },
    ],
    ctaLabel: "직거래 견적 비교해보기",
    ctaPath: "/for/company",
    closing:
      "지금 대행사 견적이 있으시면, 같은 아티스트의 XONG 섭외가 범위를 찾아드리겠습니다. 회신 주시면 바로 보내드릴게요.",
  },
};

export function buildOutreachEmail(
  segment: OutreachSegment,
  input: TemplateInput
): BuiltEmail {
  const c = COPY[segment];
  const site = siteUrl();
  const who = input.name
    ? `${input.name}님,`
    : input.org
      ? `${input.org} 담당자님,`
      : "안녕하세요,";
  const unsubUrl = `${site}/api/outreach/unsubscribe?t=${input.unsubToken}`;
  const ctaUrl = `${site}${c.ctaPath}`;

  const subject = `(광고) ${input.reminder ? c.reminderSubject : c.subject}`;

  const bulletsHtml = c.bullets
    .map(
      (b) => `
      <tr>
        <td style="padding:0 0 14px 0;">
          <div style="font-size:15px;font-weight:700;color:${INK};padding-bottom:2px;">
            <span style="color:${BRAND};">✓</span>&nbsp;${b.label}
          </div>
          <div style="font-size:13px;color:${MUTED};line-height:1.6;padding-left:18px;">${b.desc}</div>
        </td>
      </tr>`
    )
    .join("");

  const shotsHtml = c.shots
    .map(
      (s) => `
      <tr>
        <td style="padding:0 0 6px 0;">
          <img src="${site}/ir/${s.file}" width="560" alt="${s.caption}"
            style="display:block;width:100%;max-width:560px;height:auto;border-radius:10px;border:1px solid #eeeeee;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 20px 0;font-size:12px;color:#999999;">${s.caption}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:'Apple SD Gothic Neo','Malgun Gothic',AppleGothic,sans-serif;">
        <tr><td style="background:#0a0a0b;padding:22px 28px;">
          <span style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">XO<span style="color:${BRAND};">NG</span></span>
          <span style="font-size:11px;color:#888888;letter-spacing:2px;">&nbsp;&nbsp;매칭 수수료 0%</span>
        </td></tr>
        <tr><td style="padding:30px 28px 8px 28px;">
          <div style="font-size:21px;font-weight:800;color:${INK};line-height:1.35;letter-spacing:-0.5px;word-break:keep-all;">${c.hook.replace(/\n/g, "<br>")}</div>
        </td></tr>
        <tr><td style="padding:10px 28px 22px 28px;font-size:14px;color:#444444;line-height:1.75;word-break:keep-all;">
          ${c.intro(who)}
        </td></tr>
        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bulletsHtml}</table>
        </td></tr>
        <tr><td style="padding:8px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${shotsHtml}</table>
        </td></tr>
        <tr><td align="center" style="padding:6px 28px 8px 28px;">
          <a href="${ctaUrl}" target="_blank"
            style="display:inline-block;background:${BRAND};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:999px;">
            ${c.ctaLabel} →
          </a>
        </td></tr>
        <tr><td style="padding:18px 28px 26px 28px;font-size:13px;color:${MUTED};line-height:1.7;word-break:keep-all;">
          ${c.closing}
        </td></tr>
        <tr><td style="padding:18px 28px 24px 28px;border-top:1px solid #f0f0f0;font-size:11px;color:#aaaaaa;line-height:1.7;">
          XONG — 연예인·인플루언서 섭외를 가장 빠르게 연결합니다.<br>
          이 메일은 비즈니스 제휴 목적으로 발송되었습니다.
          더 이상 받고 싶지 않으시면 <a href="${unsubUrl}" style="color:#888888;">수신거부</a>를 눌러주세요. 즉시 처리됩니다.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    c.hook,
    "",
    c.intro(who).replace(/<br>/g, "\n").replace(/<[^>]+>/g, ""),
    "",
    ...c.bullets.map((b) => `- ${b.label}: ${b.desc}`),
    "",
    `${c.ctaLabel}: ${ctaUrl}`,
    "",
    c.closing,
    "",
    `수신거부: ${unsubUrl}`,
  ].join("\n");

  return { subject, html, text };
}
