-- Render User.entraOid optional and add User.googleSub (unique).
ALTER TABLE "User" ALTER COLUMN "entraOid" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
