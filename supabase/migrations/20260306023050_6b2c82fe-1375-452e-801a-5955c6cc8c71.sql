
-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  specialties text[] DEFAULT '{}',
  image_url text DEFAULT NULL,
  instagram text DEFAULT NULL,
  badge_label text DEFAULT NULL,
  badge_value text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view active team members (public page)
CREATE POLICY "Anyone can view active team members"
  ON public.team_members FOR SELECT
  USING (is_active = true);

-- Admins can manage all team members
CREATE POLICY "Admins can manage all team members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'));

-- Insert Ane Caroline as initial data
INSERT INTO public.team_members (name, role, bio, specialties, instagram, badge_label, badge_value, sort_order)
VALUES (
  'Ane Caroline',
  'Fundadora & Hair Stylist',
  'Especialista em realçar a beleza natural de cada cliente, com anos de experiência e formação internacional em técnicas capilares.',
  ARRAY['Corte', 'Coloração', 'Tratamentos Capilares'],
  '@acsbeautystudio',
  'Especialista em',
  'Hair Styling',
  0
);
