-- Migration: create weekly_reports table
-- This table stores aggregated weekly security reports.
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid REFERENCES public.sites(id),
    start_date timestamp NOT NULL,
    end_date timestamp NOT NULL,
    summary_json jsonb NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'published')),
    admin_notes text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_reports
    ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_site_id ON public.weekly_reports(site_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created_at ON public.weekly_reports(created_at DESC);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION public.update_weekly_reports_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_weekly_reports_update ON public.weekly_reports;

CREATE TRIGGER trg_weekly_reports_update
BEFORE UPDATE ON public.weekly_reports
FOR EACH ROW EXECUTE FUNCTION public.update_weekly_reports_timestamp();

-- Row Level Security policies (admin can read/write, guard can read published only)
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS weekly_reports_admin_policy ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_guard_policy ON public.weekly_reports;

-- Development policy aligned with the rest of the project while the backend uses headers-based auth.
CREATE POLICY weekly_reports_admin_policy ON public.weekly_reports
FOR ALL TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY weekly_reports_guard_policy ON public.weekly_reports
FOR SELECT TO authenticated, anon
USING (status = 'published');
