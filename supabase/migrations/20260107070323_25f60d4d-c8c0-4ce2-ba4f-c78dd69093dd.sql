-- ============================================
-- CREATE NEW ENUMS
-- ============================================
CREATE TYPE public.service_status AS ENUM ('entry', 'upsell', 'premium', 'inactive');
CREATE TYPE public.offer_type AS ENUM ('entry_offer', 'package_offer', 'consultation_offer');
CREATE TYPE public.booking_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  tags TEXT[] DEFAULT '{}',
  last_visit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_clients_instagram ON public.clients(instagram);
CREATE INDEX idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX idx_clients_last_visit ON public.clients(last_visit_at DESC);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all clients"
ON public.clients FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Staff can view clients"
ON public.clients FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update clients"
ON public.clients FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can insert clients"
ON public.clients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Marketing can view clients"
ON public.clients FOR SELECT
USING (has_role(auth.uid(), 'marketing'));

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- UPDATE SERVICES TABLE
-- ============================================
ALTER TABLE public.services 
  ADD COLUMN base_price NUMERIC,
  ADD COLUMN promo_price NUMERIC,
  ADD COLUMN status service_status DEFAULT 'entry';

UPDATE public.services SET base_price = price WHERE base_price IS NULL;

CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_active ON public.services(is_active);

-- ============================================
-- UPDATE PACKAGES TABLE
-- ============================================
ALTER TABLE public.packages 
  RENAME COLUMN sessions_included TO sessions_qty;

ALTER TABLE public.packages 
  RENAME COLUMN price TO total_price;

ALTER TABLE public.packages 
  RENAME COLUMN valid_days TO expires_days;

ALTER TABLE public.packages 
  RENAME COLUMN is_active TO active;

CREATE INDEX idx_packages_active ON public.packages(active);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  utm_campaign TEXT,
  budget NUMERIC,
  status campaign_status DEFAULT 'draft',
  primary_kpi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_channel ON public.campaigns(channel);
CREATE INDEX idx_campaigns_utm ON public.campaigns(utm_campaign);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaigns"
ON public.campaigns FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Marketing can manage campaigns"
ON public.campaigns FOR ALL
USING (has_role(auth.uid(), 'marketing'));

CREATE POLICY "Staff can view campaigns"
ON public.campaigns FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- OFFERS TABLE
-- ============================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type offer_type NOT NULL,
  headline TEXT,
  body TEXT,
  price_display TEXT,
  limit_spots INTEGER,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_type ON public.offers(type);
CREATE INDEX idx_offers_active ON public.offers(active);
CREATE INDEX idx_offers_dates ON public.offers(start_at, end_at);
CREATE INDEX idx_offers_service ON public.offers(service_id);
CREATE INDEX idx_offers_package ON public.offers(package_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
ON public.offers FOR SELECT
USING (active = true AND (start_at IS NULL OR start_at <= now()) AND (end_at IS NULL OR end_at >= now()));

CREATE POLICY "Admins can view all offers"
ON public.offers FOR SELECT
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Marketing can manage offers"
ON public.offers FOR ALL
USING (has_role(auth.uid(), 'marketing'));

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();