"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { CalendarDays, List as ListIcon } from "lucide-react";
import { fetchMyAttendance } from "@/lib/api/attendance";
import { fetchProfile } from "@/lib/api/profile";
import { queryKeys } from "@/lib/query/keys";
import { AttendanceCalendar } from "@/components/employee/AttendanceCalendar";
import { AttendanceTable } from "@/components/employee/AttendanceTable";
import { DayDetailModal } from "@/components/employee/DayDetailModal";
import { Button } from "@/components/ui";
import type { AttendanceLog } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type View = "calendar" | "list";

export default function HistoryPage() {
  const [view, setView] = useState<View>("calendar");
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [page, setPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | undefined>();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
  });
  const weekendDays = profileQuery.data?.company?.weekend_days ?? [5, 6];

  const monthRange = useMemo(() => {
    return {
      from: format(startOfMonth(monthDate), "yyyy-MM-dd"),
      to: format(endOfMonth(monthDate), "yyyy-MM-dd"),
    };
  }, [monthDate]);

  const calendarQuery = useQuery({
    queryKey: queryKeys.attendance.my({ ...monthRange, limit: 100 }),
    queryFn: () => fetchMyAttendance({ ...monthRange, limit: 100 }),
    enabled: view === "calendar",
  });

  const listQuery = useQuery({
    queryKey: queryKeys.attendance.my({ ...monthRange, page, limit: 30 }),
    queryFn: () => fetchMyAttendance({ ...monthRange, page, limit: 30 }),
    enabled: view === "list",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Browse your attendance month by month.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
          <ToggleButton
            active={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </ToggleButton>
          <ToggleButton
            active={view === "list"}
            onClick={() => setView("list")}
          >
            <ListIcon className="h-4 w-4" />
            List
          </ToggleButton>
        </div>
      </div>

      {view === "calendar" ? (
        <AttendanceCalendar
          monthDate={monthDate}
          onChangeMonth={setMonthDate}
          weekendDays={weekendDays}
          logs={calendarQuery.data?.data ?? []}
          onSelectDay={(d, log) => {
            setSelectedDay(d);
            setSelectedLog(log);
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
            <span className="text-sm font-medium">
              {format(monthDate, "LLLL yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMonthDate((d) => {
                    const nd = new Date(d);
                    nd.setMonth(nd.getMonth() - 1);
                    return nd;
                  });
                  setPage(1);
                }}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMonthDate(new Date());
                  setPage(1);
                }}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMonthDate((d) => {
                    const nd = new Date(d);
                    nd.setMonth(nd.getMonth() + 1);
                    return nd;
                  });
                  setPage(1);
                }}
              >
                Next
              </Button>
            </div>
          </div>

          <AttendanceTable
            logs={listQuery.data?.data}
            pagination={listQuery.data?.pagination}
            isLoading={listQuery.isLoading}
            onPageChange={setPage}
          />
        </div>
      )}

      <DayDetailModal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        date={selectedDay}
        log={selectedLog}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
