-- CreateTable
CREATE TABLE "crisis_city_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xpEvents" JSONB NOT NULL DEFAULT '{}',
    "badgesEarned" JSONB NOT NULL DEFAULT '{}',
    "scenarios" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_city_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crisis_city_profiles_userId_key" ON "crisis_city_profiles"("userId");

-- AddForeignKey
ALTER TABLE "crisis_city_profiles" ADD CONSTRAINT "crisis_city_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
