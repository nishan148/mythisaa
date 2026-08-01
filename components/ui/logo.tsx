import { cn } from "@/lib/utils";

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-zinc-950", className)}>
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-zinc-950 shadow-sm" aria-hidden="true">
        <span className="absolute h-3.5 w-1.5 -rotate-45 rounded-full bg-amber-400" />
        <span className="absolute h-1.5 w-3.5 translate-x-1 translate-y-1 rotate-45 rounded-full bg-amber-200" />
      </span>
      {!markOnly && <span className="text-[17px]">MythMind</span>}
    </span>
  );
}