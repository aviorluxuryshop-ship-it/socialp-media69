/*
  Warnings:

  - You are about to drop the column `durationHours` on the `Course` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "FinancialAccountType" ADD VALUE 'CREDIT_CARD';

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "durationHours",
ADD COLUMN     "durationDays" INTEGER;
