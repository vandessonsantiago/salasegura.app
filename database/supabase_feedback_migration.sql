-- =====================================================
-- FEEDBACK TABLE MIGRATION FOR SUPABASE
-- Execute this script in your Supabase SQL Editor
-- =====================================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id SERIAL PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('problem', 'suggestion')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own feedback (only certain fields)
CREATE POLICY "Users can update own feedback" ON public.feedback
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Only authenticated users can access feedback
CREATE POLICY "Only authenticated users" ON public.feedback
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feedback_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

-- Grant sequence permissions for auto-increment
GRANT USAGE, SELECT ON SEQUENCE public.feedback_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.feedback_id_seq TO service_role;

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =====================================================

-- Verification query (run this after migration)
-- SELECT
--     schemaname,
--     tablename,
--     tableowner
-- FROM pg_tables
-- WHERE tablename = 'feedback';

-- Check RLS policies
-- SELECT
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual
-- FROM pg_policies
-- WHERE tablename = 'feedback';
