-- CreateTable
CREATE TABLE "MebProcess" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "groupNumber" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MebProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MebProcess_enrollmentId_key" ON "MebProcess"("enrollmentId");

-- CreateIndex
CREATE INDEX "MebProcess_expiresAt_idx" ON "MebProcess"("expiresAt");

-- AddForeignKey
ALTER TABLE "MebProcess" ADD CONSTRAINT "MebProcess_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "GroupEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

