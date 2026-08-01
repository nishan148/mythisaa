import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl lg:text-[44px] lg:leading-[1.08]">{title}</h2>
      <p className="mt-5 text-pretty text-base leading-7 text-zinc-600 sm:text-lg">{description}</p>
    </div>
  );
}