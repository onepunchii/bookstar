"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Artist, Manager } from "@/lib/types";
import { Loader2, Phone, Plus, UserRound, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const ROLES = ["실장", "팀장", "로드매니저"];

export function ManagersPanel({
  initialManagers,
  artists,
}: {
  initialManagers: Manager[];
  artists: Artist[];
}) {
  const t = useT();
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
        setError(t("agency.managers.errLogin"));
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
      setError(t("agency.managers.errInvite"));
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
          <h2 className="text-lg font-bold">{t("agency.managers.title")}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {t("agency.managers.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen((v) => !v)}
          className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          {inviteOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {inviteOpen ? t("common.close") : t("agency.managers.invite")}
        </button>
      </div>

      {inviteOpen && (
        <Card className="mb-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("agency.managers.namePlaceholder")}
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
              placeholder={t("agency.managers.phonePlaceholder")}
              className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
            />
            <button
              onClick={invite}
              disabled={!name.trim() || saving}
              className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("agency.managers.inviteSubmit")}
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
            {t("agency.managers.empty")}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {t("agency.managers.emptyHint")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {managers.map((m) => (
          <Card key={m.id} className={m.demo ? "p-5 opacity-60" : "p-5"}>
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
                  {m.demo && (
                    <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                      {t("agency.managers.demoBadge")}
                    </span>
                  )}
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
                {t("agency.managers.assignedArtists")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.artistIds.map((id) => {
                  const artist = artists.find((a) => a.id === id);
                  return artist ? (
                    <button
                      key={id}
                      onClick={() => toggleAssign(m.id, id)}
                      title={t("agency.managers.unassignHint")}
                      className="group"
                    >
                      <Badge variant="brand">
                        {artist.name}
                        <X className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Badge>
                    </button>
                  ) : null;
                })}
                {m.demo ? (
                  <span className="rounded-full border border-dashed border-neutral-200 px-2.5 py-0.5 text-xs text-neutral-300">
                    {t("agency.managers.demoAssignHint")}
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setAssignFor((v) => (v === m.id ? null : m.id))
                    }
                    className="rounded-full border border-dashed border-neutral-300 px-2.5 py-0.5 text-xs font-medium text-neutral-400 transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    + {t("agency.managers.assign")}
                  </button>
                )}
              </div>
              {assignFor === m.id && !m.demo && (
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
                      {t("agency.managers.noArtistsToAssign")}
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
