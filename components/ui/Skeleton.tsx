import { cn } from "@/lib/utils";

/**
 * components/ui/Skeleton.tsx
 * Reusable animated placeholder skeletons to improve perceived speed.
 */
export default function Skeleton({
  className,
  variant = "text",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "text" | "circle" | "card";
}) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-800/80",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "circle" && "h-12 w-12 rounded-full",
        variant === "card" && "h-48 w-full rounded-3xl",
        className
      )}
      {...props}
    />
  );
}
