-- ─── Rate limiting table ───
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL DEFAULT 'chat',
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  call_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique
  ON public.api_rate_limits(user_id, endpoint, window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rate limits"
  ON public.api_rate_limits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- (No insert/update policies — only edge functions using service role write here)

-- ─── Profiles: onboarding + token budget ───
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_tokens_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_tokens_reset_at date DEFAULT CURRENT_DATE;

-- ─── Performance indexes ───
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_study_progress_user_topic ON public.study_progress(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON public.documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_date ON public.study_plans(user_id, plan_date);

-- ─── Batch progress update RPC ───
CREATE OR REPLACE FUNCTION public.batch_update_progress(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    INSERT INTO public.study_progress (
      user_id, topic, mastery_pct, strength,
      questions_attempted, questions_correct, last_studied_at
    )
    VALUES (
      v_user_id,
      rec->>'topic',
      LEAST(100, GREATEST(0, COALESCE((rec->>'mastery_pct')::int, 0))),
      COALESCE(rec->>'strength', 'weak'),
      COALESCE((rec->>'questions_attempted')::int, 0),
      COALESCE((rec->>'questions_correct')::int, 0),
      now()
    )
    ON CONFLICT (user_id, topic) DO UPDATE SET
      mastery_pct = LEAST(100, GREATEST(0, EXCLUDED.mastery_pct)),
      strength = EXCLUDED.strength,
      questions_attempted = study_progress.questions_attempted + EXCLUDED.questions_attempted,
      questions_correct = study_progress.questions_correct + EXCLUDED.questions_correct,
      last_studied_at = EXCLUDED.last_studied_at;
  END LOOP;
END;
$$;

-- Need a unique constraint for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_progress_user_topic_unique
  ON public.study_progress(user_id, topic);
