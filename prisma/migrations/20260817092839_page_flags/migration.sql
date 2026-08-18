-- CreateTable
CREATE TABLE "page_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_flags_pkey" PRIMARY KEY ("key")
);
