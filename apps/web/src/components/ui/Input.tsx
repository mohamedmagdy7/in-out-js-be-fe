"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leftSlot, rightSlot, ...props },
  ref,
) {
  if (leftSlot || rightSlot) {
    return (
      <div
        className={cn(
          "flex h-10 items-center rounded border bg-surface text-sm transition-shadow",
          "border-border focus-within:border-ring",
          "focus-within:ring-2 focus-within:ring-ring/30",
          invalid &&
            "border-danger focus-within:border-danger focus-within:ring-danger/30",
        )}
      >
        {leftSlot ? (
          <span className="pl-3 text-foreground-subtle">{leftSlot}</span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-full flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-foreground-subtle",
            className,
          )}
          {...props}
        />
        {rightSlot ? (
          <span className="pr-1 flex items-center">{rightSlot}</span>
        ) : null}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded border bg-surface px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-foreground-subtle",
        "border-border focus:border-ring focus:ring-2 focus:ring-ring/30",
        invalid && "border-danger focus:border-danger focus:ring-danger/30",
        className,
      )}
      {...props}
    />
  );
});
