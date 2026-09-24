import Link from "next/link";
import { cn } from "@/lib/utils";

type ManabiBrandProps = {
  compact?: boolean;
  className?: string;
};

/** Shared Manabi wordmark. Use compact form in secondary route headers. */
export function ManabiBrand({ compact = false, className }: ManabiBrandProps) {
  return (
    <Link
      href="/"
      aria-label="Manabi — trang học"
      className={cn(
        "font-bold text-primary",
        compact ? "text-base" : "flex items-center gap-3 text-[1.05rem] tracking-tight",
        className,
      )}
    >
      {!compact && (
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg text-primary-foreground">
          日
        </span>
      )}
      <span>
        Manabi<span className="text-notebook-coral">.</span>
      </span>
    </Link>
  );
}
