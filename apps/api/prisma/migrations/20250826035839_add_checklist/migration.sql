-- CreateTable
CREATE TABLE "public"."checklist_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklist_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_sessions_user_id_idx" ON "public"."checklist_sessions"("user_id");

-- CreateIndex
CREATE INDEX "checklist_items_session_id_idx" ON "public"."checklist_items"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_session_id_item_id_key" ON "public"."checklist_items"("session_id", "item_id");

-- AddForeignKey
ALTER TABLE "public"."checklist_sessions" ADD CONSTRAINT "checklist_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checklist_items" ADD CONSTRAINT "checklist_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."checklist_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
