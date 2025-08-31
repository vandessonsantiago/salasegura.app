-- =====================================================
-- TABLE: webhook_logs
-- Description: Webhook logs for payment tracking
-- Dependencies: payments
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  payload jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT webhook_logs_pkey PRIMARY KEY (id),
  CONSTRAINT webhook_logs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Indexes for webhook_logs table
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

-- RLS Policies for webhook_logs table
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook logs for their payments" ON webhook_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM payments WHERE id = payment_id AND user_id = auth.uid()::text)
);

-- Trigger for updated_at
CREATE TRIGGER update_webhook_logs_updated_at BEFORE UPDATE ON webhook_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
