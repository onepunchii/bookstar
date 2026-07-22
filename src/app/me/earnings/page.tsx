import { Card } from "@/components/ui/card";
import { getPublicArtistById, getPublicArtistBySlug } from "@/lib/data/artists";
import { getSessionArtistId } from "@/lib/data/session";
import { getSettlements } from "@/lib/data/settlements";
import { getT } from "@/lib/i18n/server";
import { formatBudget, settlementBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

// 데모 아티스트(정하늘) 기준 — DB 정산에서 본인 건만.
export default async function MyEarningsPage() {
  const { t, locale } = await getT();
  const STATUS_LABEL = {
    paid: t("me.earnings.statusPaid"),
    pending: t("me.earnings.statusPending"),
    overdue: t("me.earnings.statusOverdue"),
  } as const;
  const sessionArtistId = await getSessionArtistId();
  const artist = sessionArtistId
    ? await getPublicArtistById(sessionArtistId)
    : await getPublicArtistBySlug("haneul"); // 미가입=데모(정하늘)
  const all = await getSettlements();
  const mine = artist ? all.filter((s) => s.artistId === artist.id) : [];
  const totalNet = mine.reduce(
    (sum, s) => sum + settlementBreakdown(s).artistNet,
    0
  );
  const paidNet = mine
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + settlementBreakdown(s).artistNet, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">
        {t("me.earnings.title")}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t("me.earnings.subtitle")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">
            {t("me.earnings.netThisYear")}
          </p>
          <p className="mt-1 text-2xl font-black text-brand-600">
            {t("me.earnings.manwon", { v: totalNet.toLocaleString() })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">
            {t("me.earnings.statusPaid")}
          </p>
          <p className="mt-1 text-2xl font-black">
            {t("me.earnings.manwon", { v: paidNet.toLocaleString() })}
          </p>
        </Card>
      </div>

      <div className="mt-6 space-y-3">
        {mine.map((s) => {
          const b = settlementBreakdown(s);
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{s.eventTitle}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{s.date}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    s.status === "paid"
                      ? "bg-neutral-100 text-neutral-500"
                      : s.status === "pending"
                        ? "bg-neutral-900 text-white"
                        : "bg-brand-500 text-white"
                  )}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>{t("me.earnings.gross")}</span>
                  <span className="font-semibold text-neutral-900">
                    {formatBudget(s.gross, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>
                    {t("me.earnings.agencyShare", {
                      rate: Math.round(s.agencyRate * 100),
                    })}
                  </span>
                  <span>-{formatBudget(b.agencyShare, locale)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>{t("me.earnings.withholding")}</span>
                  <span>
                    -{t("me.earnings.manwon", { v: b.withholding.toLocaleString() })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                  <span>{t("me.earnings.net")}</span>
                  <span className="text-brand-600">
                    {t("me.earnings.manwon", { v: b.artistNet.toLocaleString() })}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
