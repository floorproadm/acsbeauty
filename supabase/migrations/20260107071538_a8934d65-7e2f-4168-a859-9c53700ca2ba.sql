-- Step 1: Check and drop any indexes on status column
DROP INDEX IF EXISTS idx_bookings_status;

-- Step 2: Add new status column as TEXT with default
ALTER TABLE public.bookings 
ADD COLUMN status_new TEXT DEFAULT 'requested';

-- Step 3: Copy exact matches only (no CASE, just direct WHERE conditions)
UPDATE public.bookings SET status_new = 'requested' WHERE status::text = 'requested';
UPDATE public.bookings SET status_new = 'confirmed' WHERE status::text = 'confirmed';
UPDATE public.bookings SET status_new = 'completed' WHERE status::text = 'completed';
UPDATE public.bookings SET status_new = 'cancelled' WHERE status::text = 'cancelled';
UPDATE public.bookings SET status_new = 'no_show' WHERE status::text = 'no_show';

-- Step 4: Set remaining nulls to default
UPDATE public.bookings SET status_new = 'requested' WHERE status_new IS NULL;

-- Step 5: Drop old status column
ALTER TABLE public.bookings DROP COLUMN status;

-- Step 6: Rename status_new to status
ALTER TABLE public.bookings RENAME COLUMN status_new TO status;

-- Step 7: Add NOT NULL constraint and set default
ALTER TABLE public.bookings ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'requested';

-- Step 8: Add check constraint for allowed values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Step 9: Recreate index on new status column
CREATE INDEX idx_bookings_status ON public.bookings(status);