import { NextResponse } from "next/server";
import { getPublicArtistBySlug } from "@/lib/data/artists";
import { getDaySchedulesByArtist } from "@/lib/data/day-schedules";
import { verifyCalendarToken } from "@/lib/calendar-token";

function escapeText(s: string) {
  return s.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
}

// YYYY-MM-DD + HH:mm → 20260707T063000
function formatLocalDT(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

// RFC 5545 라인 폴딩 — 75 옥텟(UTF-8 바이트) 기준. 한글은 1자=3바이트라
// 문자 길이(UTF-16)로 자르면 물리 라인이 75옥텟을 초과해 엄격 파서에서 깨진다.
const ENC = new TextEncoder();
function fold(line: string) {
  if (ENC.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curBytes = 0;
  let first = true;
  for (const ch of line) {
    const chBytes = ENC.encode(ch).length;
    const limit = first ? 75 : 74; // 이어지는 줄은 선행 공백 1옥텟 차지
    if (curBytes + chBytes > limit) {
      out.push(first ? cur : " " + cur);
      first = false;
      cur = ch;
      curBytes = chBytes;
    } else {
      cur += ch;
      curBytes += chBytes;
    }
  }
  if (cur) out.push(first ? cur : " " + cur);
  return out.join("\r\n");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  // 내부 운영 시트(담당·차량·동선)는 서명 토큰이 있어야만 열람 — 공개 추측 차단
  const token = new URL(req.url).searchParams.get("t");
  if (!verifyCalendarToken(artistId, token)) {
    return new NextResponse("유효하지 않은 구독 링크입니다.", { status: 403 });
  }
  // param은 uuid 또는 slug — slug면 DB에서 uuid로 해석
  const bySlug = await getPublicArtistBySlug(artistId);
  const resolvedId = bySlug?.id ?? artistId;
  const schedules = await getDaySchedulesByArtist(resolvedId);
  const artistName =
    bySlug?.name ?? schedules[0]?.artistName ?? "xong 아티스트";
  const slugForFile = bySlug?.slug ?? artistId;

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .slice(0, 15) + "Z";

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//xong//NONSGML xong Schedule//KO");
  lines.push(`X-WR-CALNAME:${escapeText(`${artistName} · xong 스케줄`)}`);
  lines.push("X-WR-TIMEZONE:Asia/Seoul");
  lines.push("CALSCALE:GREGORIAN");

  // TZ 정의 (KST)
  lines.push("BEGIN:VTIMEZONE");
  lines.push("TZID:Asia/Seoul");
  lines.push("BEGIN:STANDARD");
  lines.push("DTSTART:19700101T000000");
  lines.push("TZOFFSETFROM:+0900");
  lines.push("TZOFFSETTO:+0900");
  lines.push("TZNAME:KST");
  lines.push("END:STANDARD");
  lines.push("END:VTIMEZONE");

  for (const s of schedules) {
    const first = s.stops[0];
    const last = s.stops[s.stops.length - 1];
    if (!first || !last) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${s.id}@xong.co.kr`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;TZID=Asia/Seoul:${formatLocalDT(s.date, first.time)}`);
    lines.push(`DTEND;TZID=Asia/Seoul:${formatLocalDT(s.date, last.time)}`);
    lines.push(`SUMMARY:${escapeText(`[${s.eventType}] ${s.title}`)}`);
    if (first.location) {
      lines.push(`LOCATION:${escapeText(first.location)}`);
    }
    const description = [
      `아티스트: ${s.artistName}`,
      `담당: ${s.manager}`,
      s.vehicle ? `차량: ${s.vehicle}` : undefined,
      "",
      "타임라인:",
      ...s.stops.map(
        (st) => `${st.time} ${st.label}${st.location ? ` · ${st.location}` : ""}`
      ),
      s.memo ? `\n메모: ${s.memo}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(`DESCRIPTION:${escapeText(description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const body = lines.map(fold).join("\r\n") + "\r\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slugForFile}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
