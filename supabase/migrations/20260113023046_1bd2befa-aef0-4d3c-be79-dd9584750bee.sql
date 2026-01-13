-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'service_discovery' CHECK (type IN ('service_discovery', 'price_calculator', 'hair_diagnosis')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'text', 'scale')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz options table
CREATE TABLE public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  image_url TEXT,
  emoji TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  points JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz results table
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  service_id UUID REFERENCES public.services(id),
  package_id UUID REFERENCES public.packages(id),
  offer_id UUID REFERENCES public.offers(id),
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  cta_text TEXT DEFAULT 'Agendar agora',
  cta_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz responses table
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_instagram TEXT,
  answers JSONB NOT NULL DEFAULT '[]',
  calculated_score JSONB DEFAULT '{}',
  recommended_result_id UUID REFERENCES public.quiz_results(id),
  utm_source TEXT,
  utm_campaign TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Public read access for active quizzes
CREATE POLICY "Quizzes are viewable by everyone" 
ON public.quizzes FOR SELECT 
USING (is_active = true);

CREATE POLICY "Quiz questions are viewable by everyone" 
ON public.quiz_questions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_active = true));

CREATE POLICY "Quiz options are viewable by everyone" 
ON public.quiz_options FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quiz_questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.is_active = true));

CREATE POLICY "Quiz results are viewable by everyone" 
ON public.quiz_results FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_active = true));

-- Anyone can submit quiz responses
CREATE POLICY "Anyone can submit quiz responses" 
ON public.quiz_responses FOR INSERT 
WITH CHECK (true);

-- Admin access using correct has_role signature
CREATE POLICY "Quiz responses viewable by admins" 
ON public.quiz_responses FOR SELECT 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can manage quizzes" 
ON public.quizzes FOR ALL 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can manage quiz questions" 
ON public.quiz_questions FOR ALL 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can manage quiz options" 
ON public.quiz_options FOR ALL 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can manage quiz results" 
ON public.quiz_results FOR ALL 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can manage quiz responses" 
ON public.quiz_responses FOR ALL 
USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);
CREATE INDEX idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX idx_quiz_responses_quiz_id ON public.quiz_responses(quiz_id);
CREATE INDEX idx_quiz_responses_client_id ON public.quiz_responses(client_id);
CREATE INDEX idx_quizzes_slug ON public.quizzes(slug);