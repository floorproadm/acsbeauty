-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_contato', 'convertido', 'perdido');

-- Add status column to quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN status public.lead_status NOT NULL DEFAULT 'novo';

-- Add index for filtering by status
CREATE INDEX idx_quiz_responses_status ON public.quiz_responses(status);