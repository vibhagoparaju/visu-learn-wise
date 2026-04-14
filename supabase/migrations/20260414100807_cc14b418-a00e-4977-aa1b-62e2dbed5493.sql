ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_board text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_grade text DEFAULT NULL;