
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image text NOT NULL,
  eyebrow text,
  title text NOT NULL,
  subtitle text,
  cta_label text,
  cta_href text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY hero_slides_public_read ON public.hero_slides
  FOR SELECT TO public USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY hero_slides_admin_all ON public.hero_slides
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER hero_slides_set_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
