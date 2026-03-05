
-- Gift Cards table
CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  balance numeric NOT NULL,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  occasion text,
  personal_message text,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '1 year')
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can create gift cards (public purchase)
CREATE POLICY "Anyone can create gift cards"
  ON public.gift_cards
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can manage all gift cards
CREATE POLICY "Admins can manage all gift cards"
  ON public.gift_cards
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Staff can view gift cards
CREATE POLICY "Staff can view gift cards"
  ON public.gift_cards
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role));
