import { NextResponse } from "next/server";
import { ARTISTS, DAY_SCHEDULES } from "@/lib/mock-data";

function escapeText(s: string) {
  return s.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
}

// YYYY-MM-DD + HH:mm → 20260707T063000
function formatLocalDT(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

// Fold long lines to 75 octets per RFC 5545
function fold(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let s = line;
  parts.push(s.slice(0, 75));
  s = s.slice(75);
  while (s.length > 74) {
    parts.push(" " + s.slice(0, 74));
    s = s.slice(74);
  }
  if (s) parts.push(" " + s);
  return parts.join("\r\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  const artist = ARTISTS.find((a) => a.id === artistId || a.slug === artistId);
  if (!artist) return NextResponse.json({ error: "not found" }, { status: 404 });

  const schedules = DAY_SCHEDULES.filter((s) => s.artistId === artist.id);

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .slice(0, 15) + "Z";

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//BOOKSTAR//NONSGML BOOKSTAR Schedule//KO");
  lines.push(`X-WR-CALNAME:${escapeText(`${artist.name} · BOOKSTAR 스케줄`)}`);
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
    lines.push(`UID:${s.id}@bookstar.kr`);
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
      "Content-Disposition": `inline; filename="${artist.slug || artist.id}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
