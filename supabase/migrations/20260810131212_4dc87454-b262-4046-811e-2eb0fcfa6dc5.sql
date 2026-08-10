-- SuperFrete replaces the manually maintained CEP price ranges.
-- Existing rows remain untouched so past orders keep their historical context.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_weight_kg NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS shipping_height_cm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS shipping_width_cm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS shipping_length_cm NUMERIC(8,2),
  ADD CONSTRAINT products_shipping_weight_positive CHECK (shipping_weight_kg IS NULL OR shipping_weight_kg > 0),
  ADD CONSTRAINT products_shipping_height_positive CHECK (shipping_height_cm IS NULL OR shipping_height_cm > 0),
  ADD CONSTRAINT products_shipping_width_positive CHECK (shipping_width_cm IS NULL OR shipping_width_cm > 0),
  ADD CONSTRAINT products_shipping_length_positive CHECK (shipping_length_cm IS NULL OR shipping_length_cm > 0);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS superfrete_service_id INTEGER,
  ADD COLUMN IF NOT EXISTS superfrete_delivery_min INTEGER,
  ADD COLUMN IF NOT EXISTS superfrete_delivery_max INTEGER,
  ADD COLUMN IF NOT EXISTS superfrete_volume JSONB,
  ADD COLUMN IF NOT EXISTS superfrete_order_id TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_status TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_label_url TEXT,
  ADD CONSTRAINT orders_superfrete_delivery_valid CHECK (
    superfrete_delivery_min IS NULL
    OR superfrete_delivery_max IS NULL
    OR superfrete_delivery_min <= superfrete_delivery_max
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_superfrete_order_id
  ON public.orders(superfrete_order_id)
  WHERE superfrete_order_id IS NOT NULL;