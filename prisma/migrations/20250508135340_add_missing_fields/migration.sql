-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "email" TEXT;
ALTER TABLE "Admin" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "Admin" ADD COLUMN "otpExpiry" DATETIME;

-- AlterTable
ALTER TABLE "Country" ADD COLUMN "code" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "User" ADD COLUMN "otpExpiry" DATETIME;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
