"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "outline";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ variant = "ghost", className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded text-foreground-muted transition-colors",
          "focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variant === "ghost" && "hover:bg-surface-hover hover:text-foreground",
          variant === "outline" &&
            "border border-border hover:bg-surface-hover hover:text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
