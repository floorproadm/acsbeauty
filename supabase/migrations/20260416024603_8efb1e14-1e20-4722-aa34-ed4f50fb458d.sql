-- Add staff_profile_id to team_members to link public members to auth profiles
ALTER TABLE public.team_members
ADD COLUMN staff_profile_id uuid REFERENCES public.staff_profiles(user_id) ON DELETE SET NULL UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_team_members_staff_profile_id ON public.team_members(staff_profile_id);

-- Comment for documentation
COMMENT ON COLUMN public.team_members.staff_profile_id IS 'Optional link to staff_profiles.user_id for booking/schedule integration';