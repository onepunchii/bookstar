"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getScenario } from "@/lib/samples";
import { Lightbulb, X } from "lucide-react";

function SampleHintInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("sample");
  const scenario = id ? getScenario(id) : undefined;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setDismissed(false), [id]);

  if (!scenario || dismissed) return null;

  const close = () => {
    setDismissed(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sample");
    const query = params.toString();
    router.replace(
      (query ? `${window.location.pathname}?${query}` : window.location.pathname) as never
    );
  };

  return (
    <div className="border-b border-brand-200 bg-brand-50/70 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Lightbulb className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-700">
            샘플 시나리오 · {scenario.title}
          </p>
          <p className="mt-0.5 text-sm text-neutral-700">{scenario.hint}</p>
        </div>
        <button
          onClick={close}
          aria-label="힌트 닫기"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-neutral-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SampleHint() {
  return (
    <Suspense fallback={null}>
      <SampleHintInner />
    </Suspense>
  );
}
