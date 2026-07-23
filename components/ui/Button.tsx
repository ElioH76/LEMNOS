import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "outline-light" | "light";

const VARIANTS: Record<Variant, string> = {
  // Vert Littoral plein — l'action principale.
  primary: "bg-green text-white hover:bg-green-dark",
  // Contour anthracite sur fond clair.
  outline: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white",
  // Contour clair sur fond sombre.
  "outline-light": "border-[1.5px] border-white/50 text-white hover:border-white",
  // Plein blanc sur fond sombre.
  light: "bg-white text-ink hover:bg-paper",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-sharp px-7 py-[15px] text-[13.5px] font-semibold tracking-btn transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
