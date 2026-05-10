"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[88px] w-full rounded border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-shadow placeholder:text-foreground-subtle",
          "border-border focus:border-ring focus:ring-2 focus:ring-ring/30",
          invalid && "border-danger focus:border-danger focus:ring-danger/30",
          className,
        )}
        {...props}
      />
    );
  },
);
