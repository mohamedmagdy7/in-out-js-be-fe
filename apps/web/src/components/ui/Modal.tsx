"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-fade-in",
          SIZE[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div className="flex-1">
              {title ? (
                <h3 className="text-base font-semibold tracking-tight">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-foreground-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton
              onClick={onClose}
              aria-label="Close"
              className="-mr-2"
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-border bg-surface-muted/40 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
