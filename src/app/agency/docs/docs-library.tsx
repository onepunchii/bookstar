"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";
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
  const t = useT();
  const [filter, setFilter] = useState<DocType | "전체">("전체");
  const [docs, setDocs] = useState<DocumentItem[]>(documents);
  const [uploadType, setUploadType] = useState<DocType>("계약서");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const typeLabel = (type: DocType | "전체") => {
    switch (type) {
      case "전체":
        return t("agency.docs.typeAll");
      case "계약서":
        return t("agency.docs.typeContract");
      case "큐시트":
        return t("agency.docs.typeCuesheet");
      case "공문":
        return t("agency.docs.typeOfficial");
      case "정산서":
        return t("agency.docs.typeSettlement");
      default:
        return type;
    }
  };

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
        setError(t("agency.docs.errorLogin"));
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
      setError(t("agency.docs.errorUpload"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((docType) => (
            <button
              key={docType}
              onClick={() => setFilter(docType)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === docType
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
              )}
            >
              {typeLabel(docType)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as DocType)}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm"
            aria-label={t("agency.docs.typeSelectLabel")}
          >
            {TYPES.filter((docType) => docType !== "전체").map((docType) => (
              <option key={docType} value={docType}>
                {typeLabel(docType)}
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
            {uploading ? t("agency.docs.uploading") : t("agency.docs.uploadCta")}
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
            className={
              doc.demo
                ? "flex items-center gap-4 p-4 opacity-60"
                : "flex items-center gap-4 p-4 transition-colors hover:border-neutral-400"
            }
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <FileText className="h-4.5 w-4.5 text-neutral-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{doc.name}</p>
                {doc.demo && (
                  <span className="shrink-0 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                    {t("agency.docs.demoBadge")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-neutral-400">
                {[doc.eventTitle, doc.artistName, doc.date]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Badge variant={doc.type === "계약서" ? "brand" : "default"}>
              {typeLabel(doc.type)}
            </Badge>
            {doc.demo ? (
              <span
                title={t("agency.docs.demoDocTitle")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-200"
              >
                <Download className="h-4 w-4" />
              </span>
            ) : doc.fileUrl ? (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.name}
                aria-label={t("agency.docs.download")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <span
                title={t("agency.docs.sampleNoFile")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-200"
              >
                <Download className="h-4 w-4" />
              </span>
            )}
          </Card>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-700">
              {t("agency.docs.emptyTitle")}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {t("agency.docs.emptyDesc")}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        {t("agency.docs.autoArchiveNote")}
      </p>
    </div>
  );
}
