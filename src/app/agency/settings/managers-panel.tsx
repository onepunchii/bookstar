"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Artist, Manager } from "@/lib/types";
import { Loader2, Phone, Plus, UserRound, X } from "lucide-react";

const ROLES = ["실장", "팀장", "로드매니저"];

export function ManagersPanel({
  initialManagers,
  artists,
}: {
  initialManagers: Manager[];
  artists: Artist[];
}) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("로드매니저");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 배정 드롭다운이 열린 매니저 id
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const invite = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, phone }),
      });
      if (res.status === 401) {
        setError("로그인 후 초대할 수 있어요.");
        return;
      }
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      setManagers((prev) => [
        ...prev,
        { id, name: name.trim(), role, phone, artistIds: [] },
      ]);
      setName("");
      setPhone("");
      setInviteOpen(false);
    } catch {
      setError("초대에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssign = (managerId: string, artistId: string) => {
    setManagers((prev) =>
      prev.map((m) => {
        if (m.id !== managerId) return m;
        const has = m.artistIds.includes(artistId);
        const artistIds = has
          ? m.artistIds.filter((x) => x !== artistId)
          : [...m.artistIds, artistId];
        // DB 반영 (낙관적)
        fetch("/api/managers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: managerId, artistIds }),
        }).catch(() => {});
        return { ...m, artistIds };
      })
    );
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">매니저 관리</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            담당 매니저는 자기 담당 아티스트의 일정과 요청만 볼 수 있어요
          </p>
        </div>
        <button
          onClick={() => setInviteOpen((v) => !v)}
          className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          {inviteOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {inviteOpen ? "닫기" : "매니저 초대"}
        </button>
      </div>

      {inviteOpen && (
        <Card className="mb-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="연락처 (선택)"
              className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
            />
            <button
              onClick={invite}
              disabled={!name.trim() || saving}
              className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              초대하기
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
          )}
        </Card>
      )}

      {managers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
          <p className="text-sm font-semibold text-neutral-700">
            아직 등록된 매니저가 없어요
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            &lsquo;매니저 초대&rsquo;로 담당자를 추가하면 담당 아티스트별로 권한을
            나눌 수 있어요.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {managers.map((m) => (
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
                {m.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Phone className="h-3 w-3" /> {m.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-400">
                담당 아티스트
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.artistIds.map((id) => {
                  const artist = artists.find((a) => a.id === id);
                  return artist ? (
                    <button
                      key={id}
                      onClick={() => toggleAssign(m.id, id)}
                      title="클릭하면 배정 해제"
                      className="group"
                    >
                      <Badge variant="brand">
                        {artist.name}
                        <X className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Badge>
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() =>
                    setAssignFor((v) => (v === m.id ? null : m.id))
                  }
                  className="rounded-full border border-dashed border-neutral-300 px-2.5 py-0.5 text-xs font-medium text-neutral-400 transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  + 배정
                </button>
              </div>
              {assignFor === m.id && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl bg-neutral-50 p-2.5">
                  {artists
                    .filter((a) => !m.artistIds.includes(a.id))
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() => toggleAssign(m.id, a.id)}
                        className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        + {a.name}
                      </button>
                    ))}
                  {artists.filter((a) => !m.artistIds.includes(a.id))
                    .length === 0 && (
                    <span className="text-xs text-neutral-400">
                      배정할 아티스트가 없어요
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
