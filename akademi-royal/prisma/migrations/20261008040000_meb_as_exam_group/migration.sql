-- DropForeignKey
ALTER TABLE "CourseGroup" DROP CONSTRAINT "CourseGroup_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "MebProcess" DROP CONSTRAINT "MebProcess_enrollmentId_fkey";

-- DropIndex
DROP INDEX "MebProcess_enrollmentId_key";

-- DropIndex
DROP INDEX "MebProcess_expiresAt_idx";

-- AlterTable
ALTER TABLE "CourseGroup" ALTER COLUMN "trainerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GroupEnrollment" ADD COLUMN     "mebProcessId" TEXT;

-- AlterTable
ALTER TABLE "MebProcess" DROP COLUMN "enrollmentId",
DROP COLUMN "expiresAt",
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "completionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "courseId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MebProcess_completionDate_idx" ON "MebProcess"("completionDate");

-- CreateIndex
CREATE INDEX "MebProcess_courseId_idx" ON "MebProcess"("courseId");

-- AddForeignKey
ALTER TABLE "CourseGroup" ADD CONSTRAINT "CourseGroup_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEnrollment" ADD CONSTRAINT "GroupEnrollment_mebProcessId_fkey" FOREIGN KEY ("mebProcessId") REFERENCES "MebProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MebProcess" ADD CONSTRAINT "MebProcess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

