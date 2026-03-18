
CREATE TABLE IF NOT EXISTS public.client_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  redeemed_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(client_id)
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.client_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own points"
ON public.client_points FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins manage points"
ON public.client_points FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Clients view own transactions"
ON public.point_transactions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.client_points cp WHERE cp.client_id = point_transactions.client_id AND cp.user_id = auth.uid())
);

CREATE POLICY "Admins manage transactions"
ON public.point_transactions FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE OR REPLACE FUNCTION public.award_acs_points()
RETURNS TRIGGER AS $$
DECLARE v_points INTEGER;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    v_points := COALESCE(ROUND(NEW.total_price), 0);
    IF v_points > 0 AND NEW.client_id IS NOT NULL THEN
      INSERT INTO public.client_points (client_id, total_points)
      VALUES (NEW.client_id, 0)
      ON CONFLICT (client_id) DO NOTHING;

      UPDATE public.client_points
      SET total_points = total_points + v_points, updated_at = now()
      WHERE client_id = NEW.client_id;

      INSERT INTO public.point_transactions (client_id, booking_id, type, points, description)
      VALUES (NEW.client_id, NEW.id, 'earn', v_points, 'ACS Points — agendamento confirmado');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER award_acs_points_trigger
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.award_acs_points();
