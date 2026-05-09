
-- Enum para status do convite
DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  token text NOT NULL UNIQUE,
  status public.invite_status NOT NULL DEFAULT 'pending',
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON public.admin_invites (lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON public.admin_invites (token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_status ON public.admin_invites (status);

-- Apenas um pendente por email
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_invites_pending_email
  ON public.admin_invites (lower(email)) WHERE status = 'pending';

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
  ON public.admin_invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin_owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner'));

-- Trigger updated_at
CREATE TRIGGER update_admin_invites_updated_at
  BEFORE UPDATE ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para expirar convites antigos
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.admin_invites
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
$$;
