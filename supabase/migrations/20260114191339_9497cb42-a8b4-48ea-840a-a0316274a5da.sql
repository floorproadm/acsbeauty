-- Add unique constraint on clients phone for upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_unique ON public.clients(phone) WHERE phone IS NOT NULL;

-- Ensure RLS policies allow anonymous inserts properly
DROP POLICY IF EXISTS "Anyone can submit quiz responses" ON public.quiz_responses;
CREATE POLICY "Anyone can submit quiz responses" 
ON public.quiz_responses 
FOR INSERT 
TO public, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create clients" ON public.clients;
CREATE POLICY "Anyone can create clients" 
ON public.clients 
FOR INSERT 
TO public, anon
WITH CHECK (true);