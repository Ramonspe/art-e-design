ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

CREATE TABLE public.developer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('checkout')),
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX developer_events_created_at_idx ON public.developer_events (created_at DESC);

ALTER TABLE public.developer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer_events_developer_read" ON public.developer_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'developer')
    OR public.has_role(auth.uid(), 'admin')
  );
