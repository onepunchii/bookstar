// 이메일 전용 "미니 원페이저" — 클릭 없이 본문에서 핵심이 다 보이는 스크롤형.
// 이메일 클라이언트(지메일·네이버·아웃룩)는 CSS 대부분을 제거하므로
// 테이블 레이아웃 + 인라인 스타일만 사용. 스크린샷은 배포 사이트의 /ir/*.jpg 참조.
// 법적 요건: 제목 (광고) 표기 + 본문 수신거부 링크 (정보통신망법).
//
// 설계 원칙: 타깃마다 "잃고 있는 것"이 다르다 → 헤드라인·본문·CTA 완전 분리.
// - 인플루언서: 수수료로 떼이는 돈  → "전부 내 것"
// - 기획사: 흩어진 문의·놓치는 딜   → "한 화면에서, 마진 그대로" (※'중간 마진 제거' 금지)
// - 광고주: 견적에 숨은 마진·컨택   → "직접, 투명하게, 빠르게"
// 첫 접촉 메일에는 유료·구독·요금제 등 수익모델 언급을 넣지 않는다(방어막 유발).

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
const INK = "#0a0a0b";
const BODY = "#3a3a3c";
const MUTED = "#8a8a8e";
const HAIRLINE = "#ececec";

interface SegmentCopy {
  subjects: string[]; // A/B — 연락처별로 안정적으로 1개 선택
  reminderSubject: string;
  preheader: string; // 받은편지함 제목 옆 미리보기 텍스트
  eyebrow: string;
  hook: string; // \n 은 <br>로
  intro: (who: string) => string;
  bullets: { label: string; desc: string }[];
  shots: { file: string; caption: string }[];
  ctaLabel: string;
  ctaPath: string;
  closing: string;
}

const COPY: Record<OutreachSegment, SegmentCopy> = {
  creator: {
    subjects: [
      "출연료 100만원이면, 100만원 전부 내 통장에",
      "섭외 문의, 수수료 0%로 직접 받으세요",
      "협찬 스팸에 파묻힌 진짜 섭외, 몇 개나 놓치셨어요?",
    ],
    reminderSubject: "섭외 페이지, 3초면 생깁니다 — 다시 안내드려요",
    preheader:
      "광고주가 예산·날짜를 적어서 직접 문의합니다. 성사돼도 수수료 0원.",
    eyebrow: "For Creators",
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
        desc: "가입비도, 성사 수수료도 없습니다. 100만원 섭외면 100만원이 그대로 내 통장에.",
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

  agency: {
    subjects: [
      "소속 아티스트 섭외 문의, 아직 대표메일 하나로 받고 계신가요?",
      "\"섭외하고 싶은데 어디로 연락하죠?\" — 이 질문에서 새는 매출",
      "소속 아티스트 공식 섭외 창구, 무료로 열어드립니다",
    ],
    reminderSubject: "소속 아티스트 섭외 창구 안내 — 다시 보내드려요",
    preheader:
      "예산·날짜가 정리된 섭외 요청만, 아티스트별로, 한 대시보드에서.",
    eyebrow: "For Agencies",
    hook: "놓치는 섭외 없이,\n소속 아티스트 전원의 문의를 한 화면에서",
    intro: (who) =>
      `${who} 안녕하세요, 연예인·인플루언서 섭외 플랫폼 <b>XONG</b>입니다.<br><br>행사·브랜드 광고주가 아티스트를 직접 검색하고 섭외하는 <b>공식 창구</b>를 열고 있습니다. 대표메일·인스타 DM·지인 소개로 흩어져 들어오던 문의 — 그중 협찬 스팸에 묻혀 사라진 딜이 없었을까요? 아티스트별 공식 페이지 하나로 모아 <b>지금 선점하세요.</b>`,
    bullets: [
      {
        label: "소속 아티스트 전원, 공식 섭외 페이지",
        desc: "아티스트별 페이지에 구독자·화제성·섭외가 범위가 정리되어 광고주가 직접 찾아옵니다. 영업 없이 들어오는 인바운드 채널을 지금 선점하세요.",
      },
      {
        label: "문의는 '요청 카드'로만 — 간보기 차단",
        desc: "예산·날짜 필수 입력이라, 예산 없는 단가 문의와 일정 미정 간보기가 애초에 들어올 수 없습니다. 회신할 가치가 있는 문의만 남습니다.",
      },
      {
        label: "정체불명 주최자 자동 필터",
        desc: "사업자 미인증 주최자에게는 경고 배지가 붙습니다. 업체 실체 확인에 쓰던 시간을 줄이세요.",
      },
      {
        label: "성사 수수료 0% — 계약·마진 구조는 그대로",
        desc: "XONG은 성사 금액에서 아무것도 떼지 않습니다. 협상·계약·정산 모두 기존 방식 그대로, 문의가 들어오는 길만 넓혀드립니다.",
      },
    ],
    shots: [
      {
        file: "artists.jpg",
        caption: "광고주 검색 화면 — 소속 아티스트가 이렇게 노출됩니다",
      },
      {
        file: "agency-inbox.jpg",
        caption: "섭외 대시보드 — 아티스트별 문의가 예산·날짜순으로 정리",
      },
    ],
    ctaLabel: "소속 아티스트 페이지 무료 개설하기",
    ctaPath: "/for/agency",
    closing:
      "아티스트가 많아 일괄 등록이 필요하시면, 회신 주시는 대로 10분 온라인 미팅으로 대시보드를 직접 보여드리겠습니다.",
  },

  company: {
    subjects: [
      "이번 행사 예산으로 섭외 가능한 인플루언서, 30초면 나옵니다",
      "인플루언서 섭외가, 견적서 받기 전에 먼저 확인하세요",
      "\"섭외 견적 문의드립니다\" 메일, 이제 그만 쓰셔도 됩니다",
    ],
    reminderSubject: "섭외가 먼저 보는 인플루언서 섭외 — 다시 안내드려요",
    preheader:
      "섭외가·구독자·화제성 공개. 예산과 날짜만 적으면 아티스트 측이 직접 회신합니다.",
    eyebrow: "For Brands",
    hook: "섭외가를 먼저 보고,\n직접 문의하세요",
    intro: (who) =>
      `${who} 안녕하세요, 연예인·인플루언서 섭외 플랫폼 <b>XONG</b>입니다.<br><br>행사에 맞는 인플루언서를 찾을 때 보통 대행사에 리스트 요청 → 견적 대기 → 예산 초과 → 다시 요청. 정작 그 사람을 얼마에 부를 수 있는지는 끝까지 견적서 뒤에 숨어 있습니다. <b>XONG에서는 순서가 반대입니다.</b>`,
    bullets: [
      {
        label: "섭외가 범위가 먼저 공개되어 있습니다",
        desc: "예산에 맞는 후보만 걸러서 보세요. 견적 받고 나서 예산 초과를 아는 일이 없습니다.",
      },
      {
        label: "구독자·화제성을 한 화면에서 비교",
        desc: "후보별 채널 규모와 최근 화제성이 프로필에 정리되어 있어, 내부 보고용 비교표가 따로 필요 없습니다.",
      },
      {
        label: "요청 카드 작성 → 담당 창구에 바로 전달",
        desc: "행사 개요·예산·날짜를 적으면 아티스트 측 공식 창구로 바로 전달되고, 직접 회신을 받습니다. 연락처 수소문, 회신 없는 메일이 사라집니다.",
      },
      {
        label: "문의 무료 · 중개 수수료 0원",
        desc: "문의에 비용이 들지 않습니다. 조건 협의도 아티스트 측과 직접 하시면 됩니다.",
      },
    ],
    shots: [
      {
        file: "artists.jpg",
        caption: "검색 화면 — 예산 범위로 필터링된 후보 리스트",
      },
      {
        file: "agency-inbox.jpg",
        caption: "요청 카드 — 이 화면 하나로 섭외 문의가 끝납니다",
      },
    ],
    ctaLabel: "예산에 맞는 인플루언서 검색하기",
    ctaPath: "/for/company",
    closing:
      "회원가입 없이 검색까지는 바로 가능합니다. 섭외는 빠를수록 좋은 조건으로 잡힙니다.",
  },
};

// 관리 콘솔 미리보기용 — 제목 A/B·리마인드 제목·프리뷰 텍스트 노출
export function getSegmentCopy(segment: OutreachSegment): {
  subjects: string[];
  reminderSubject: string;
  preheader: string;
  ctaPath: string;
} {
  const c = COPY[segment];
  return {
    subjects: c.subjects,
    reminderSubject: c.reminderSubject,
    preheader: c.preheader,
    ctaPath: c.ctaPath,
  };
}

// 이메일 HTML에 들어가는 사용자 입력(name/org) 이스케이프 — 인젝션·레이아웃 깨짐 방지
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 제목 A/B — 같은 연락처는 항상 같은 제목(안정적). unsubToken을 시드로 사용.
function pickSubject(subjects: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return subjects[h % subjects.length];
}

export function buildOutreachEmail(
  segment: OutreachSegment,
  input: TemplateInput
): BuiltEmail {
  const c = COPY[segment];
  const site = siteUrl();
  const rawWho = input.name
    ? `${input.name}님,`
    : input.org
      ? `${input.org} 담당자님,`
      : "안녕하세요,";
  const who = escapeHtml(rawWho);
  const unsubUrl = `${site}/api/outreach/unsubscribe?t=${input.unsubToken}`;
  const ctaUrl = `${site}${c.ctaPath}`;

  const subject = `(광고) ${
    input.reminder ? c.reminderSubject : pickSubject(c.subjects, input.unsubToken)
  }`;

  // ── 불릿 (오렌지 체크 원 + 라벨/설명) ──
  const bulletsHtml = c.bullets
    .map(
      (b) => `
      <tr>
        <td valign="top" style="padding:0 12px 18px 0;width:26px;">
          <div style="width:22px;height:22px;border-radius:50%;background:${BRAND};color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:22px;">✓</div>
        </td>
        <td valign="top" style="padding:0 0 18px 0;">
          <div style="font-size:15.5px;font-weight:700;color:${INK};letter-spacing:-0.3px;padding-bottom:3px;">${b.label}</div>
          <div style="font-size:13.5px;color:${MUTED};line-height:1.65;word-break:keep-all;">${b.desc}</div>
        </td>
      </tr>`
    )
    .join("");

  // ── 스크린샷 (테두리 카드 + 캡션) ──
  const shotsHtml = c.shots
    .map(
      (s) => `
      <tr><td style="padding:0 0 8px 0;">
        <img src="${site}/ir/${s.file}" width="536" alt="${escapeHtml(s.caption)}"
          style="display:block;width:100%;max-width:536px;height:auto;border-radius:12px;border:1px solid ${HAIRLINE};" />
      </td></tr>
      <tr><td style="padding:0 0 22px 4px;font-size:12px;color:${MUTED};letter-spacing:-0.2px;">
        <span style="color:${BRAND};font-weight:700;">▸</span>&nbsp;${s.caption}
      </td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <!-- 프리헤더: 받은편지함 미리보기 텍스트 -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f4f5;font-size:1px;line-height:1px;">
    ${escapeHtml(c.preheader)}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:28px 12px 40px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:'Apple SD Gothic Neo','Malgun Gothic',AppleGothic,'Segoe UI',sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

        <!-- 헤더 바 -->
        <tr><td style="background:${INK};padding:18px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.6px;">XO<span style="color:${BRAND};">NG</span></td>
            <td align="right" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:1.5px;text-transform:uppercase;">${c.eyebrow}</td>
          </tr></table>
        </td></tr>

        <!-- 후킹 헤드라인 -->
        <tr><td style="padding:38px 32px 0 32px;">
          <div style="font-size:10.5px;font-weight:700;color:${BRAND};letter-spacing:2px;text-transform:uppercase;padding-bottom:14px;">매칭 수수료 0%</div>
          <div style="font-size:24px;font-weight:800;color:${INK};line-height:1.32;letter-spacing:-0.8px;word-break:keep-all;">${c.hook.replace(/\n/g, "<br>")}</div>
        </td></tr>

        <!-- 인트로 -->
        <tr><td style="padding:20px 32px 26px 32px;font-size:14.5px;color:${BODY};line-height:1.8;word-break:keep-all;">
          ${c.intro(who)}
        </td></tr>

        <!-- 구분선 -->
        <tr><td style="padding:0 32px;"><div style="height:1px;background:${HAIRLINE};"></div></td></tr>

        <!-- 불릿 -->
        <tr><td style="padding:26px 32px 8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bulletsHtml}</table>
        </td></tr>

        <!-- 스크린샷 -->
        <tr><td style="padding:14px 32px 0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${shotsHtml}</table>
        </td></tr>

        <!-- CTA 버튼 -->
        <tr><td align="center" style="padding:12px 32px 4px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:999px;background:${BRAND};box-shadow:0 8px 20px -6px rgba(255,90,0,0.5);">
              <a href="${ctaUrl}" target="_blank"
                style="display:inline-block;padding:15px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;letter-spacing:-0.3px;">
                ${c.ctaLabel}&nbsp;&nbsp;→
              </a>
            </td>
          </tr></table>
        </td></tr>

        <!-- 클로징 -->
        <tr><td style="padding:22px 32px 30px 32px;font-size:13.5px;color:${MUTED};line-height:1.75;word-break:keep-all;text-align:center;">
          ${c.closing}
        </td></tr>

        <!-- 푸터 -->
        <tr><td style="padding:22px 32px 28px 32px;border-top:1px solid #f2f2f2;background:#fafafa;">
          <div style="font-size:11.5px;color:#a8a8ac;line-height:1.7;">
            <b style="color:#88888c;">XONG</b> — 연예인·인플루언서 섭외를 가장 빠르게 연결합니다.<br>
            이 메일은 비즈니스 제휴 목적으로 발송되었습니다.
            더 이상 받고 싶지 않으시면 <a href="${unsubUrl}" style="color:#88888c;text-decoration:underline;">수신거부</a>를 눌러주세요. 즉시 처리됩니다.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    c.hook.replace(/\n/g, " "),
    "",
    c
      .intro(rawWho)
      .replace(/<br>/g, "\n")
      .replace(/<[^>]+>/g, ""),
    "",
    ...c.bullets.map((b) => `✓ ${b.label}\n   ${b.desc}`),
    "",
    `${c.ctaLabel}: ${ctaUrl}`,
    "",
    c.closing,
    "",
    "─────────",
    "XONG — 연예인·인플루언서 섭외를 가장 빠르게 연결합니다.",
    `수신거부: ${unsubUrl}`,
  ].join("\n");

  return { subject, html, text };
}
