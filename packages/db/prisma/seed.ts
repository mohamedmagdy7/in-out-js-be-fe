import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "@repo/shared";

const prisma = new PrismaClient();

async function main() {
  // // 1. Company
  // const company = await prisma.company.upsert({
  //   where: { slug: "acme" },
  //   update: {},
  //   create: {
  //     name: "Acme Corp",
  //     slug: "acme",
  //     timezone: "Africa/Cairo",
  //     daily_hours_threshold: 8,
  //     weekend_days: [5, 6],
  //   },
  // });

  // // 2. Departments
  // const engineering = await prisma.department.upsert({
  //   where: { company_id_name: { company_id: company.id, name: "Engineering" } },
  //   update: {},
  //   create: { company_id: company.id, name: "Engineering" },
  // });

  // const operations = await prisma.department.upsert({
  //   where: { company_id_name: { company_id: company.id, name: "Operations" } },
  //   update: {},
  //   create: { company_id: company.id, name: "Operations" },
  // });

  // // 3. Shift
  // const shift = await prisma.shift.upsert({
  //   where: { company_id_name: { company_id: company.id, name: "Standard" } },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     name: "Standard",
  //     start_time: "09:00",
  //     end_time: "17:00",
  //     is_default: true,
  //   },
  // });

  // // 4. Leave types
  // await prisma.leaveType.upsert({
  //   where: {
  //     company_id_name: { company_id: company.id, name: "Annual Leave" },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     name: "Annual Leave",
  //     days_per_year: 21,
  //     is_paid: true,
  //   },
  // });

  // await prisma.leaveType.upsert({
  //   where: {
  //     company_id_name: { company_id: company.id, name: "Sick Leave" },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     name: "Sick Leave",
  //     days_per_year: 10,
  //     is_paid: true,
  //   },
  // });

  // 5. Users
  // SUPER_ADMIN has no company — find by email+role, create if missing
  let superAdmin = await prisma.user.findFirst({
    where: { email: "super@admin.com", role: Role.SUPER_ADMIN },
  });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: "super@admin.com",
        password: hashPassword("Admin123!"),
        first_name: "Super",
        last_name: "Admin",
        role: Role.SUPER_ADMIN,
      },
    });
  }

  // const hrAdmin = await prisma.user.upsert({
  //   where: {
  //     email_company_id: { email: "hr@acme.com", company_id: company.id },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     email: "hr@acme.com",
  //     password: hashPassword("Admin123!"),
  //     first_name: "HR",
  //     last_name: "Admin",
  //     role: Role.HR_ADMIN,
  //     department_id: operations.id,
  //   },
  // });

  // const manager = await prisma.user.upsert({
  //   where: {
  //     email_company_id: { email: "manager@acme.com", company_id: company.id },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     email: "manager@acme.com",
  //     password: hashPassword("Admin123!"),
  //     first_name: "John",
  //     last_name: "Manager",
  //     role: Role.MANAGER,
  //     department_id: engineering.id,
  //     shift_id: shift.id,
  //   },
  // });

  // await prisma.user.upsert({
  //   where: {
  //     email_company_id: { email: "alice@acme.com", company_id: company.id },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     email: "alice@acme.com",
  //     password: hashPassword("Admin123!"),
  //     first_name: "Alice",
  //     last_name: "Employee",
  //     role: Role.EMPLOYEE,
  //     department_id: engineering.id,
  //     shift_id: shift.id,
  //     manager_id: manager.id,
  //   },
  // });

  // await prisma.user.upsert({
  //   where: {
  //     email_company_id: { email: "bob@acme.com", company_id: company.id },
  //   },
  //   update: {},
  //   create: {
  //     company_id: company.id,
  //     email: "bob@acme.com",
  //     password: hashPassword("Admin123!"),
  //     first_name: "Bob",
  //     last_name: "Employee",
  //     role: Role.EMPLOYEE,
  //     department_id: operations.id,
  //     shift_id: shift.id,
  //     manager_id: manager.id,
  //   },
  // });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
