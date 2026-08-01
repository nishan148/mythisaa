import { type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-zinc-950 text-white shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-lg",
        accent: "bg-amber-400 text-zinc-950 shadow-sm hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-lg",
        outline: "border border-zinc-200 bg-white text-zinc-900 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md",
        ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-13 px-6 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };