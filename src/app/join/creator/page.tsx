import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getT } from "@/lib/i18n/server";
import { CreatorWizard } from "./creator-wizard";

export const metadata = {
  title: "크리에이터 등록 · xong",
  description:
    "인플루언서·유튜버·크리에이터 셀프 등록. 프로필을 올리면 브랜드가 직접 섭외 제안을 보냅니다. 매칭 수수료 0%.",
  alternates: { canonical: "/join/creator" },
};

export default async function CreatorJoinPage() {
  const { t } = await getT();
  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/join" aria-label={t("join.creator.backToJoin")}>
            <Wordmark height={20} />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-900"
          >
            {t("join.creator.later")}
          </Link>
        </div>
      </header>
      <CreatorWizard />
    </div>
  );
}
