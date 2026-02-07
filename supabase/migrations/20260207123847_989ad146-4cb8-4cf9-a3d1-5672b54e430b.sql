-- =============================================
-- FASE 1: FOUNDATION - VARIAÇÕES E SKUs
-- 100% ADITIVO - NÃO ALTERA NADA EXISTENTE
-- =============================================

-- Tabela: service_variations
-- Representa técnicas/tipos de um serviço pai
CREATE TABLE public.service_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_variation_name_per_service UNIQUE(service_id, name)
);

-- Índices para service_variations
CREATE INDEX idx_service_variations_service_id ON public.service_variations(service_id);
CREATE INDEX idx_service_variations_is_active ON public.service_variations(is_active);

-- Tabela: service_skus
-- Unidade executável com duração e preço específicos
CREATE TABLE public.service_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  variation_id uuid NULL REFERENCES public.service_variations(id) ON DELETE SET NULL,
  sku_code text NULL,
  name text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric NULL,
  promo_price numeric NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT check_sku_duration_positive CHECK(duration_minutes > 0),
  CONSTRAINT unique_sku_name_per_service UNIQUE(service_id, name)
);

-- Índices para service_skus
CREATE INDEX idx_service_skus_service_id ON public.service_skus(service_id);
CREATE INDEX idx_service_skus_variation_id ON public.service_skus(variation_id);
CREATE INDEX idx_service_skus_is_active ON public.service_skus(is_active);

-- Trigger para updated_at em service_variations
CREATE TRIGGER update_service_variations_updated_at
  BEFORE UPDATE ON public.service_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em service_skus
CREATE TRIGGER update_service_skus_updated_at
  BEFORE UPDATE ON public.service_skus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES - ACESSO RESTRITO A ADMIN/STAFF
-- NENHUM ACESSO PÚBLICO (anon)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.service_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_skus ENABLE ROW LEVEL SECURITY;

-- service_variations: SELECT para admin e staff
CREATE POLICY "Admin and staff can view variations"
  ON public.service_variations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_owner'::app_role) OR 
    public.has_role(auth.uid(), 'staff'::app_role)
  );

-- service_variations: INSERT/UPDATE/DELETE apenas para admin
CREATE POLICY "Only admin can manage variations"
  ON public.service_variations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner'::app_role));

-- service_skus: SELECT para admin e staff
CREATE POLICY "Admin and staff can view skus"
  ON public.service_skus
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_owner'::app_role) OR 
    public.has_role(auth.uid(), 'staff'::app_role)
  );

-- service_skus: INSERT/UPDATE/DELETE apenas para admin
CREATE POLICY "Only admin can manage skus"
  ON public.service_skus
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner'::app_role));