"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DOCUMENTS } from "@/lib/mock-data";
import type { DocType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, FileText, Upload } from "lucide-react";

const TYPES: (DocType | "전체")[] = [
  "전체",
  "계약서",
  "큐시트",
  "공문",
  "정산서",
];

export function DocsLibrary() {
  const [filter, setFilter] = useState<DocType | "전체">("전체");
  const docs = DOCUMENTS.filter((d) => filter === "전체" || d.type === filter);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === t
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          <Upload className="h-4 w-4" /> 문서 업로드
        </button>
      </div>

      <div className="space-y-2">
        {docs.map((doc) => (
          <Card
            key={doc.id}
            className="flex items-center gap-4 p-4 transition-colors hover:border-neutral-400"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <FileText className="h-4.5 w-4.5 text-neutral-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{doc.name}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {doc.eventTitle} · {doc.artistName} · {doc.date}
              </p>
            </div>
            <Badge
              variant={doc.type === "계약서" ? "brand" : "default"}
            >
              {doc.type}
            </Badge>
            <button
              aria-label="다운로드"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Download className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        전자계약(2차 오픈)으로 체결한 계약서는 자동으로 서류함에 보관됩니다.
      </p>
    </div>
  );
}
