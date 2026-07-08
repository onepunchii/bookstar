// 인바운드 답장 → Claude가 의도 분류 + 답장 초안 생성 (관리자 승인 후 발송)
// 필요 env: ANTHROPIC_API_KEY

import Anthropic from "@anthropic-ai/sdk";

export interface ReplyDraft {
  intent: "interested" | "question" | "rejected" | "meeting" | "other";
  summary: string;
  draft: string;
}

const SYSTEM = `너는 섭외 플랫폼 xong의 세일즈 담당자다. 콜드메일에 대한 답장이 오면 의도를 분류하고, 한국어 비즈니스 톤의 답장 초안을 작성한다.

xong 확정 사실 (이 범위를 벗어난 확답 금지):
- 매칭 수수료 0%. 광고주는 완전 무료.
- 소속사 요금제: Free 0원(아티스트 5팀, 인박스·프로필·캘린더) / Growth 월 9만원(20팀, 데일리 시트·정산 자동화·매니저 스코프) / Enterprise 월 50만원~(무제한, 전자계약·API·전담 CS).
- 크리에이터(1인)는 평생 무료.
- 부가: 에스크로 거래액 1%, 전자계약 건당 5,000원 (2차 오픈 예정).
- 기능: 섭외 인박스(AI 공문 인식), 데일리 시트 카톡 전파, 가용성 캘린더(더블부킹 차단), 정산 자동화(원천징수 3.3%), 서류함, 아티스트 공개 페이지.
- 소개 링크: 기획사 xong.kr/for/agency, 크리에이터 xong.kr/for/creator, 기업 xong.kr/for/company, 회사소개 xong.kr/ir.

초안 작성 원칙:
- 3~6문장, 정중하되 담백하게. 과장·아부 금지.
- 문서에 없는 가격·조건·일정은 확답하지 말고 "확인 후 회신드리겠습니다"로.
- 미팅 요청이면 이번 주/다음 주 중 10분 통화를 제안하고 가능한 시간대를 묻는다.
- 거절이면 짧게 감사 인사 + 필요할 때 다시 찾을 수 있는 링크 하나만 남긴다.
- 서명은 "xong 드림"으로 끝낸다.`;

const SCHEMA = {
  type: "object" as const,
  properties: {
    intent: {
      type: "string" as const,
      enum: ["interested", "question", "rejected", "meeting", "other"],
      description: "답장의 의도 분류",
    },
    summary: {
      type: "string" as const,
      description: "답장 내용 한 줄 요약 (한국어)",
    },
    draft: {
      type: "string" as const,
      description: "그대로 발송 가능한 한국어 답장 초안 전문",
    },
  },
  required: ["intent", "summary", "draft"],
  additionalProperties: false as const,
};

export async function classifyAndDraft(input: {
  segment: string | null;
  org: string | null;
  name: string | null;
  subject: string | null;
  body: string;
}): Promise<ReplyDraft | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: {
      format: { type: "json_schema", schema: SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `상대 정보: 세그먼트=${input.segment ?? "미상"}, 조직=${input.org ?? "미상"}, 이름=${input.name ?? "미상"}
원래 메일 제목: ${input.subject ?? "(없음)"}

받은 답장 원문:
"""
${input.body.slice(0, 6000)}
"""

의도를 분류하고 답장 초안을 작성해줘.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  try {
    return JSON.parse(textBlock.text) as ReplyDraft;
  } catch {
    return null;
  }
}
