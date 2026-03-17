-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id text NOT NULL, -- Guard ID (document_id or uuid)
    message text NOT NULL,
    type text DEFAULT 'assignment',
    status text DEFAULT 'pending', -- pending, acknowledged
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    acknowledged_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON public.notifications(status);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Simple policies (auth only)
DROP POLICY IF EXISTS "Anyone can select notifications" ON public.notifications;
CREATE POLICY "Anyone can select notifications" ON public.notifications
FOR SELECT USING (true); -- Usually we'd restrict to guard_id = auth.uid() but keeping it simple for dev

DROP POLICY IF EXISTS "Anyone can update notifications" ON public.notifications;
CREATE POLICY "Anyone can update notifications" ON public.notifications
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- RPC to get the last notification per user for a site
CREATE OR REPLACE FUNCTION public.get_latest_notifications_per_user(site_id_param uuid)
RETURNS TABLE (
    user_id text,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (n.user_id) n.user_id, n.status
    FROM public.notifications n
    WHERE n.site_id = site_id_param
    ORDER BY n.user_id, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Enable Realtime for notifications
-- (Run this in the Supabase SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity to FULL for updates/deletes if needed for realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
