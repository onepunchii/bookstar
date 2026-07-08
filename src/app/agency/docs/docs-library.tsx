"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DocType, DocumentItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, FileText, Loader2, Upload } from "lucide-react";

const TYPES: (DocType | "전체")[] = [
  "전체",
  "계약서",
  "큐시트",
  "공문",
  "정산서",
];

export function DocsLibrary({ documents }: { documents: DocumentItem[] }) {
  const [filter, setFilter] = useState<DocType | "전체">("전체");
  const [docs, setDocs] = useState<DocumentItem[]>(documents);
  const [uploadType, setUploadType] = useState<DocType>("계약서");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = docs.filter((d) => filter === "전체" || d.type === filter);

  const handleUpload = async (file: File | undefined | null) => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", uploadType);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (res.status === 401) {
        setError("로그인 후 업로드할 수 있어요.");
        return;
      }
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { id: string; url: string; date: string };
      setDocs((prev) => [
        {
          id: d.id,
          name: file.name,
          type: uploadType,
          eventTitle: "",
          artistName: "",
          date: d.date,
          fileUrl: d.url,
        },
        ...prev,
      ]);
    } catch {
      setError("업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
        <div className="flex items-center gap-2">
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as DocType)}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm"
            aria-label="문서 유형"
          >
            {TYPES.filter((t) => t !== "전체").map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "업로드 중…" : "문서 업로드"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>
      )}

      <div className="space-y-2">
        {visible.map((doc) => (
          <Card
            key={doc.id}
            className="flex items-center gap-4 p-4 transition-colors hover:border-neutral-400"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <FileText className="h-4.5 w-4.5 text-neutral-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{doc.name}</p>
              <p className="mt-0.5 truncate text-xs text-neutral-400">
                {[doc.eventTitle, doc.artistName, doc.date]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Badge variant={doc.type === "계약서" ? "brand" : "default"}>
              {doc.type}
            </Badge>
            {doc.fileUrl ? (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.name}
                aria-label="다운로드"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <span
                title="샘플 문서 (파일 없음)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-200"
              >
                <Download className="h-4 w-4" />
              </span>
            )}
          </Card>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        전자계약(2차 오픈)으로 체결한 계약서는 자동으로 서류함에 보관됩니다.
      </p>
    </div>
  );
}
