import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getT } from "@/lib/i18n/server";
import { CreatorWizard } from "./creator-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT({ botDefault: "ko" });
  return {
    title: { absolute: t("meta.joinCreator.title") },
    description: t("meta.joinCreator.desc"),
    alternates: { canonical: "/join/creator" },
    openGraph: {
      title: t("meta.joinCreator.title"),
      description: t("meta.joinCreator.desc"),
    },
  };
}

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
