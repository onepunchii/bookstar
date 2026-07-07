import Image from "next/image";
import { cn } from "@/lib/utils";

// xong 워드마크 — 로고 파일 xong1.webp를 사용.
// 원본 838 × 229 (~3.66:1)
interface WordmarkProps {
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Wordmark({
  height = 22,
  className,
  priority = false,
}: WordmarkProps) {
  const width = Math.round((height * 838) / 229);
  return (
    <Image
      src="/xong1.webp"
      alt="xong · eXperience ON"
      width={width}
      height={height}
      priority={priority}
      className={cn("select-none", className)}
      style={{ height, width }}
    />
  );
}
