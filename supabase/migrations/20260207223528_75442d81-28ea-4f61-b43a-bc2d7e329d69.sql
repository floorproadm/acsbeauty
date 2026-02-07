-- Create contact_submissions table for contact form leads
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  service_interest TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  client_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit contact form (public form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Admins can manage all submissions
CREATE POLICY "Admins can manage contact submissions"
ON public.contact_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Marketing can view submissions
CREATE POLICY "Marketing can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'marketing'::app_role));

-- Staff can view submissions
CREATE POLICY "Staff can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();