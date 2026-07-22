"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { SessionAgency } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Building2, CheckCircle2, Crown, User } from "lucide-react";

const TYPES = [
  {
    key: "solo" as const,
    icon: User,
    titleKey: "agency.account.soloTitle",
    planKey: "common.free",
    descKey: "agency.account.soloDesc",
  },
  {
    key: "company" as const,
    icon: Building2,
    titleKey: "agency.account.companyTitle",
    planKey: "agency.account.companyPlan",
    descKey: "agency.account.companyDesc",
  },
];

export function AccountForm({ agency }: { agency: SessionAgency }) {
  const t = useT();
  const [type, setType] = useState<"solo" | "company">(
    agency.agencyType === "company" ? "company" : "solo"
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: String(fd.get("companyName") ?? "").trim(),
          agencyType: type,
          manager: String(fd.get("manager") ?? "").trim() || null,
          phone: String(fd.get("phone") ?? "").trim() || null,
          email: String(fd.get("email") ?? "").trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError(t("agency.account.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> {t("agency.account.saved")}
        </div>
      )}

      {/* 유형 선택 → 요금제 */}
      <div>
        <Label>{t("agency.account.typeSectionLabel")}</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setType(item.key)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-colors",
                type === item.key
                  ? "border-brand-500 bg-brand-50/50"
                  : "border-neutral-200 hover:border-neutral-400"
              )}
            >
              <div className="flex items-center justify-between">
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    type === item.key ? "text-brand-600" : "text-neutral-400"
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                    item.key === "company"
                      ? "bg-neutral-900 text-white"
                      : "bg-brand-500 text-white"
                  )}
                >
                  {item.key === "company" && <Crown className="h-3 w-3" />}
                  {t(item.planKey)}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold">{t(item.titleKey)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                {t(item.descKey)}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          {t("agency.account.typeHint")}
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="font-bold">{t("agency.account.basicInfo")}</h2>
        <div>
          <Label htmlFor="companyName">{t("agency.account.companyName")}</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={agency.companyName}
            placeholder={t("agency.account.companyNamePlaceholder")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="manager">{t("agency.account.manager")}</Label>
            <Input
              id="manager"
              name="manager"
              defaultValue={agency.manager ?? ""}
              placeholder={t("agency.account.managerPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="phone">{t("agency.account.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={agency.phone ?? ""}
              placeholder={t("agency.account.phonePlaceholder")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">{t("agency.account.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={agency.email ?? ""}
            placeholder={t("agency.account.emailPlaceholder")}
          />
        </div>
      </Card>

      {error && (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      )}
      <Button size="lg" type="submit" disabled={saving}>
        {saving ? t("agency.account.saving") : t("agency.account.saveCta")}
      </Button>
    </form>
  );
}
