import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { CreatorWizard } from "./creator-wizard";

export const metadata = {
  title: "크리에이터 등록 · xong",
};

export default function CreatorJoinPage() {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/join" aria-label="가입 처음으로">
            <Wordmark height={20} />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-900"
          >
            나중에 하기
          </Link>
        </div>
      </header>
      <CreatorWizard />
    </div>
  );
}
