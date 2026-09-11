ALTER TABLE public.ticket_businesses
  ADD COLUMN IF NOT EXISTS offer_previews jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ticket_businesses
  ADD CONSTRAINT ticket_businesses_offer_previews_array
  CHECK (jsonb_typeof(offer_previews) = 'array' AND jsonb_array_length(offer_previews) <= 6);
