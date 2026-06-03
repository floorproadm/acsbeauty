
CREATE TABLE IF NOT EXISTS public.studio_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.studio_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_settings TO authenticated;
GRANT ALL ON public.studio_settings TO service_role;

ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read studio settings"
  ON public.studio_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage studio settings"
  ON public.studio_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin_owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE TRIGGER studio_settings_updated_at
  BEFORE UPDATE ON public.studio_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current hardcoded values
INSERT INTO public.studio_settings (key, value) VALUES
  ('studio_info', jsonb_build_object(
    'name', 'ACS Beauty Studio',
    'address', '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ 07105',
    'phone', '+17329153430',
    'whatsapp', '+17329153430',
    'email', 'acsbeautystudio@gmail.com',
    'website', 'https://acsbeautystudio.com',
    'timezone', 'America/New_York',
    'hours', jsonb_build_object(
      'sunday',    jsonb_build_object('open', false, 'start', '09:00', 'end', '18:00'),
      'monday',    jsonb_build_object('open', false, 'start', '09:00', 'end', '18:00'),
      'tuesday',   jsonb_build_object('open', true,  'start', '09:00', 'end', '18:00'),
      'wednesday', jsonb_build_object('open', true,  'start', '09:00', 'end', '18:00'),
      'thursday',  jsonb_build_object('open', true,  'start', '09:00', 'end', '18:00'),
      'friday',    jsonb_build_object('open', true,  'start', '09:00', 'end', '18:00'),
      'saturday',  jsonb_build_object('open', true,  'start', '09:00', 'end', '18:00')
    )
  )),
  ('booking_rules', jsonb_build_object(
    'min_lead_hours', 2,
    'max_advance_days', 60,
    'hold_duration_minutes', 5,
    'buffer_minutes', 10,
    'max_concurrent_per_pro', 1,
    'blocked_dates', '[]'::jsonb
  )),
  ('email_config', jsonb_build_object(
    'enabled', jsonb_build_object(
      'booking_confirmed', true,
      'booking_cancelled', true,
      'reminder_24h', true,
      'giftcard_recipient', true,
      'reengagement', true
    ),
    'reengagement_cooldown_days', 90,
    'segments', jsonb_build_object(
      'occasional_days', 60,
      'absent_days', 90,
      'inactive_days', 180
    ),
    'subjects', jsonb_build_object(
      'booking_confirmed', '✅ Seu agendamento foi confirmado — ACS Beauty Studio',
      'booking_cancelled', 'Agendamento cancelado — ACS Beauty Studio',
      'reminder_24h', '⏰ Lembrete: seu atendimento é amanhã',
      'giftcard_recipient', '💝 Você recebeu um Gift Card ACS Beauty Studio!',
      'reengagement', 'Sentimos sua falta na ACS Beauty Studio 💛'
    )
  )),
  ('master_data', jsonb_build_object(
    'service_categories', jsonb_build_array(
      jsonb_build_object('name', 'Cabelo', 'color', '#8b7355'),
      jsonb_build_object('name', 'Sobrancelhas', 'color', '#a08066'),
      jsonb_build_object('name', 'Unhas', 'color', '#c9a87c')
    ),
    'giftcard_amounts', jsonb_build_array(50, 100, 150, 200, 300, 500),
    'site_texts', jsonb_build_object(
      'tagline_pt', 'Onde você se torna exatamente quem você já é',
      'tagline_en', 'Where you become exactly who you already are',
      'meta_description_pt', 'ACS Beauty Studio — Newark, NJ. Cabelo, sobrancelhas e unhas com atendimento premium.',
      'meta_description_en', 'ACS Beauty Studio — Newark, NJ. Premium hair, brows and nail services.'
    )
  ))
ON CONFLICT (key) DO NOTHING;
