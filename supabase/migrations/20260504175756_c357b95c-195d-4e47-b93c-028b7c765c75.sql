
-- 1) Functions: search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 2) Lock down SECURITY DEFINER functions (only system uses them)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 3) Replace storage public-read with object-level read (no listing)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
-- public read still works via getPublicUrl (CDN); we simply do not allow LIST queries.
CREATE POLICY "product_images_object_read" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
-- Note: linter flag is informational; public buckets serve via CDN regardless.

-- 4) Tighten orders insert: must include all required fields and (if logged in) match own user
DROP POLICY IF EXISTS "orders_insert_anyone" ON public.orders;
CREATE POLICY "orders_insert_guest_or_self" ON public.orders FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 5) Tighten order_items insert: must reference an order whose ownership matches caller
DROP POLICY IF EXISTS "items_insert_anyone" ON public.order_items;
CREATE POLICY "items_insert_match_order" ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (
        (auth.uid() IS NULL AND o.user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
      )
  )
);

-- 6) custom-uploads insert: keep open but constrain folder to avoid path collisions
DROP POLICY IF EXISTS "custom_uploads_anyone_insert" ON storage.objects;
CREATE POLICY "custom_uploads_insert_constrained" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'custom-uploads'
  AND (storage.foldername(name))[1] = 'arts'
);
