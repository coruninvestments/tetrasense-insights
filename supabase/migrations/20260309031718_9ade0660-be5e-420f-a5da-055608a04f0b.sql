CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON public.session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON public.session_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);