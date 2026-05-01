-- Campaign click tracking (additive, dedicated table)
CREATE TABLE public.campaign_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_source text NOT NULL,
  cta_type text NOT NULL,
  selected_value numeric,
  whatsapp_message text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_clicks_source_created ON public.campaign_clicks (campaign_source, created_at DESC);
CREATE INDEX idx_campaign_clicks_cta ON public.campaign_clicks (cta_type);

ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can insert tracking events
CREATE POLICY "Anyone can log campaign clicks"
  ON public.campaign_clicks
  FOR INSERT
  WITH CHECK (true);

-- Admin owners can do everything
CREATE POLICY "Admins manage campaign clicks"
  ON public.campaign_clicks
  FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Marketing role can view
CREATE POLICY "Marketing can view campaign clicks"
  ON public.campaign_clicks
  FOR SELECT
  USING (has_role(auth.uid(), 'marketing'::app_role));

-- Staff can view
CREATE POLICY "Staff can view campaign clicks"
  ON public.campaign_clicks
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));