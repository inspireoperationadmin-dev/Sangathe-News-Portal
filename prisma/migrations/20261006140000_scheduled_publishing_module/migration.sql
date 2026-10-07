CREATE TABLE "scheduler_runs" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "expiredBreakingCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "scheduler_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scheduler_runs_startedAt_idx" ON "scheduler_runs"("startedAt");
CREATE INDEX "scheduler_runs_status_startedAt_idx" ON "scheduler_runs"("status", "startedAt");
