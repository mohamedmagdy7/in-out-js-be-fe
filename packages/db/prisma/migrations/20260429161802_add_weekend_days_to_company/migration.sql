-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "weekend_days" INTEGER[] DEFAULT ARRAY[5, 6]::INTEGER[];
