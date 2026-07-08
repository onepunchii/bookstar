import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getManagers } from "@/lib/data/managers";
import { INTEGRATIONS, integrationStatus } from "@/lib/integrations";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Phone,
  Plug,
  Plus,
  UserRound,
} from "lucide-react";

export default async function AgencySettingsPage() {
  const status = integrationStatus();
  const connected = Object.values(status).filter(Boolean).length;
    const agency = await getSessionAgency();
  const [ARTISTS, MANAGERS] = await Promise.all([
    getAgencyArtists(agency?.id),
    getManagers(),
  ]);

  return (
    <div className="space-y-10">
      {/* 외부 연동 */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-bold">
              <Plug className="h-4 w-4 text-brand-500" /> 외부 API 연동
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              키를 발급받아 Vercel 환경변수에 넣으면 mock이 실데이터로 자동
              전환돼요
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              connected === INTEGRATIONS.length
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 text-neutral-600"
            )}
          >
            {connected}/{INTEGRATIONS.length} 연결됨
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((it) => {
            const on = status[it.key];
            return (
              <Card key={it.key} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{it.title}</h3>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          on
                            ? "bg-brand-500 text-white"
                            : "bg-neutral-100 text-neutral-500"
                        )}
                      >
                        {on ? (
                          <>
                            <CheckCircle2 className="h-2.5 w-2.5" /> 연결됨
                          </>
                        ) : (
                          <>
                            <CircleAlert className="h-2.5 w-2.5" /> mock 사용 중
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {it.provider} · {it.purpose}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  <p>
                    <span className="font-semibold text-neutral-700">환경변수:</span>{" "}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px] text-neutral-700">
                      {it.envVar}
                    </code>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-700">무료 한도:</span>{" "}
                    {it.freeTier}
                  </p>
                </div>
                <a
                  href={it.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  키 발급받기 <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 매니저 관리 */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">매니저 관리</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              담당 매니저는 자기 담당 아티스트의 일정과 요청만 볼 수 있어요
            </p>
          </div>
          <button className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            <Plus className="h-4 w-4" /> 매니저 초대
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MANAGERS.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    <Badge variant={m.role === "실장" ? "dark" : "default"}>
                      {m.role}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Phone className="h-3 w-3" /> {m.phone}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-neutral-400">
                  담당 아티스트
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.artistIds.map((id) => {
                    const artist = ARTISTS.find((a) => a.id === id);
                    return artist ? (
                      <Badge key={id} variant="brand">
                        {artist.name}
                      </Badge>
                    ) : null;
                  })}
                  <button className="rounded-full border border-dashed border-neutral-300 px-2.5 py-0.5 text-xs font-medium text-neutral-400 transition-colors hover:border-brand-500 hover:text-brand-600">
                    + 배정
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
