"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  createEmployee,
  fetchDepartments,
  fetchEmployees,
  fetchShifts,
  type CreateEmployeeBody,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "@/components/ui";
import {
  EmployeeForm,
  type CreateFormValues,
} from "@/components/admin/EmployeeForm";

export default function NewEmployeePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });
  const shiftsQuery = useQuery({
    queryKey: queryKeys.admin.shifts,
    queryFn: fetchShifts,
  });
  const managersQuery = useQuery({
    queryKey: queryKeys.admin.employees({ role: "MANAGER", limit: 100 }),
    queryFn: () => fetchEmployees({ role: "MANAGER", limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: (body: CreateEmployeeBody) => createEmployee(body),
    onSuccess: () => {
      toast.success("Employee created. Welcome email sent.");
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.companyStats });
      router.push("/admin/employees");
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not create employee",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const onSubmit = (values: CreateFormValues) => {
    mutation.mutate({
      email: values.email.trim(),
      password: values.password,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      role: values.role,
      department_id: values.department_id || undefined,
      shift_id: values.shift_id || undefined,
      manager_id: values.manager_id || undefined,
      phone: values.phone || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          A welcome email with login credentials will be sent on save.
        </p>
      </div>

      <EmployeeForm
        mode="create"
        departments={departmentsQuery.data ?? []}
        shifts={shiftsQuery.data ?? []}
        managers={managersQuery.data?.data ?? []}
        onSubmit={onSubmit}
        onCancel={() => router.push("/admin/employees")}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
