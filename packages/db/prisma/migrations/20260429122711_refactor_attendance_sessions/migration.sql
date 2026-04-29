/*
  Warnings:

  - You are about to drop the column `check_in_at` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_lat` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `check_in_lng` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_at` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_lat` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `check_out_lng` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `work_minutes` on the `AttendanceLog` table. All the data in the column will be lost.
  - Made the column `overtime_minutes` on table `AttendanceLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AttendanceLog" DROP COLUMN "check_in_at",
DROP COLUMN "check_in_lat",
DROP COLUMN "check_in_lng",
DROP COLUMN "check_out_at",
DROP COLUMN "check_out_lat",
DROP COLUMN "check_out_lng",
DROP COLUMN "work_minutes",
ADD COLUMN     "total_work_minutes" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "overtime_minutes" SET NOT NULL,
ALTER COLUMN "overtime_minutes" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "check_in_at" TIMESTAMP(3) NOT NULL,
    "check_out_at" TIMESTAMP(3),
    "check_in_lat" DOUBLE PRECISION,
    "check_in_lng" DOUBLE PRECISION,
    "check_out_lat" DOUBLE PRECISION,
    "check_out_lng" DOUBLE PRECISION,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "AttendanceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
