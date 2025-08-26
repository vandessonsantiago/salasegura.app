-- CreateTable
CREATE TABLE "public"."agendamentos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_id" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT NOT NULL,
    "cliente_telefone" TEXT NOT NULL,
    "qr_code_pix" TEXT,
    "copy_paste_pix" TEXT,
    "pix_expires_at" TEXT,
    "calendar_event_id" TEXT,
    "google_meet_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agendamentos_user_id_idx" ON "public"."agendamentos"("user_id");

-- CreateIndex
CREATE INDEX "agendamentos_data_horario_idx" ON "public"."agendamentos"("data", "horario");

-- AddForeignKey
ALTER TABLE "public"."agendamentos" ADD CONSTRAINT "agendamentos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
