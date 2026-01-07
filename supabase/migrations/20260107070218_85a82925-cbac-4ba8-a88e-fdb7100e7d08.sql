-- Step 1: Drop policies that use has_role function
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage package services" ON public.package_services;
DROP POLICY IF EXISTS "Anyone can view package services" ON public.package_services;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings with valid data" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS public.has_role CASCADE;

-- Step 3: Convert role column to TEXT
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- Step 4: Drop old enum
DROP TYPE IF EXISTS public.app_role;

-- Step 5: Create new enum with correct values
CREATE TYPE public.app_role AS ENUM ('admin_owner', 'staff', 'marketing');

-- Step 6: Map old roles to new ones and convert back
UPDATE public.user_roles SET role = 'admin_owner' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'staff' WHERE role IN ('staff', 'client');

-- Step 7: Convert back to enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'staff'::app_role;

-- Step 8: Recreate the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 9: Recreate user_roles policies
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Step 10: Recreate profiles policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Step 11: Recreate services policies
CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Admins can view all services"
ON public.services FOR SELECT
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

-- Step 12: Recreate packages policies
CREATE POLICY "Admins can manage packages"
ON public.packages FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Admins can view all packages"
ON public.packages FOR SELECT
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (is_active = true);

-- Step 13: Recreate package_services policies  
CREATE POLICY "Admins can manage package services"
ON public.package_services FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Anyone can view package services"
ON public.package_services FOR SELECT
USING (true);

-- Step 14: Recreate bookings policies (basic for now, will update fully later)
CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL
USING (has_role(auth.uid(), 'admin_owner'));

CREATE POLICY "Staff can view all bookings"
ON public.bookings FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update bookings"
ON public.bookings FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

-- Step 15: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;