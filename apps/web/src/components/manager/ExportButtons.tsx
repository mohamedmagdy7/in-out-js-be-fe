"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { Download, FileText } from "lucide-react";
import {
  downloadBlob,
  exportAttendanceCsv,
  exportAttendancePdf,
  type AttendanceReportQuery,
} from "@/lib/api/manager";
import { Button, toast } from "@/components/ui";

type Props = {
  query: AttendanceReportQuery;
  disabled?: boolean;
};

export function ExportButtons({ query, disabled }: Props) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const run = async (format: "csv" | "pdf") => {
    try {
      setBusy(format);
      const blob =
        format === "csv"
          ? await exportAttendanceCsv(query)
          : await exportAttendancePdf(query);
      const filename = `attendance-${query.from}-to-${query.to}.${format}`;
      downloadBlob(blob, filename);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(
        `Export failed`,
        axiosErr.response?.data?.message ?? "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => run("csv")}
        loading={busy === "csv"}
        disabled={disabled || busy !== null}
      >
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<FileText className="h-4 w-4" />}
        onClick={() => run("pdf")}
        loading={busy === "pdf"}
        disabled={disabled || busy !== null}
      >
        Export PDF
      </Button>
    </div>
  );
}
