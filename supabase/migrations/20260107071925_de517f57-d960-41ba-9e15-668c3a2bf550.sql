-- Step 1: Create staff_profiles table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies (drop first if exist)
DROP POLICY IF EXISTS "Staff can view all staff profiles" ON public.staff_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.staff_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.staff_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.staff_profiles;

CREATE POLICY "Staff can view all staff profiles"
ON public.staff_profiles FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role) OR has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Users can view own profile"
ON public.staff_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.staff_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.staff_profiles FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Step 4: Migrate data from existing profiles table
INSERT INTO public.staff_profiles (user_id, name, phone, avatar_url, created_at, updated_at)
SELECT user_id, full_name, phone, avatar_url, created_at, updated_at
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Drop existing FK constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_staff_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;

-- Step 6: Add FK constraint from bookings.staff_id to staff_profiles
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES public.staff_profiles(user_id) ON DELETE SET NULL;

-- Step 7: Add FK constraint from bookings.client_id to clients
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active ON public.staff_profiles(active);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON public.bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);

-- Step 9: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON public.staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 10: Update handle_new_user function to use staff_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.staff_profiles (user_id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;