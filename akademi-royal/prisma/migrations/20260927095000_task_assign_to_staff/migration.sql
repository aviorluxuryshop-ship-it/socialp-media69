-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToUserId_fkey";

-- DropIndex
DROP INDEX "Task_assignedToUserId_status_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedToUserId",
ADD COLUMN     "assignedToStaffId" TEXT;

-- CreateIndex
CREATE INDEX "Task_assignedToStaffId_status_idx" ON "Task"("assignedToStaffId", "status");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToStaffId_fkey" FOREIGN KEY ("assignedToStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

