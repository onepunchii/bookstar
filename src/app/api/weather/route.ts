import { NextResponse } from "next/server";
import { fetchKmaForecast } from "@/lib/kma";

// 실 기상청 예보 (근접일 +3일). 범위 밖·실패 시 204 → 클라이언트가 mock 유지.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const location = searchParams.get("location") ?? undefined;
  if (!date) return NextResponse.json({ error: "date 필요" }, { status: 400 });

  const forecast = await fetchKmaForecast(date, location);
  if (!forecast) return new NextResponse(null, { status: 204 });

  return NextResponse.json(forecast, {
    headers: { "Cache-Control": "public, max-age=1800" },
  });
}
