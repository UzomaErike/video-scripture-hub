CREATE TABLE IF NOT EXISTS public.job_state (
  job_name text PRIMARY KEY,
  status text NOT NULL DEFAULT 'idle',
  pause_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  last_error text,
  processed_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.job_state TO service_role;

ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: this table is only touched by server-side
-- privileged code (service role bypasses RLS).

INSERT INTO public.job_state (job_name, status)
VALUES ('summary-backfill', 'idle')
ON CONFLICT (job_name) DO NOTHING;