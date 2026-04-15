import { supabase } from "@/integrations/supabase/client";

const XP_PER_STUDY = 10;
const XP_PER_QUIZ_CORRECT = 15;
const XP_PER_QUIZ_WRONG = 3;
const XP_PER_FLASHCARD = 5;
const XP_PER_LEVEL = 100;

export async function awardXP(userId: string, amount: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, streak_days, last_study_date")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const newXp = (profile.xp || 0) + amount;
  const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

  // Streak logic
  const today = new Date().toISOString().split("T")[0];
  const lastDate = profile.last_study_date;
  let newStreak = profile.streak_days || 0;

  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else if (lastDate !== today) {
      newStreak = 1; // reset
    }
  }

  const { data } = await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      streak_days: newStreak,
      last_study_date: today,
    })
    .eq("id", userId)
    .select("xp, level, streak_days")
    .single();

  return data;
}

export async function awardStudyXP(userId: string) {
  return awardXP(userId, XP_PER_STUDY);
}

export async function awardQuizXP(userId: string, correct: number, total: number) {
  const amount = correct * XP_PER_QUIZ_CORRECT + (total - correct) * XP_PER_QUIZ_WRONG;
  return awardXP(userId, amount);
}

export async function awardFlashcardXP(userId: string) {
  return awardXP(userId, XP_PER_FLASHCARD);
}

export async function trackQuizProgress(userId: string, topic: string, correct: number, total: number) {
  const { data: existing } = await supabase
    .from("study_progress")
    .select("id, questions_attempted, questions_correct, mastery_pct")
    .eq("user_id", userId)
    .eq("topic", topic)
    .maybeSingle();

  const attempted = (existing?.questions_attempted || 0) + total;
  const correctTotal = (existing?.questions_correct || 0) + correct;
  const accuracy = Math.round((correctTotal / attempted) * 100);
  const newMastery = Math.min(100, Math.max(existing?.mastery_pct || 0, accuracy));
  const strength = newMastery >= 75 ? "strong" : newMastery >= 40 ? "moderate" : "weak";

  if (existing) {
    await supabase
      .from("study_progress")
      .update({
        mastery_pct: newMastery,
        strength,
        questions_attempted: attempted,
        questions_correct: correctTotal,
        last_studied_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("study_progress").insert({
      user_id: userId,
      topic,
      mastery_pct: newMastery,
      strength,
      questions_attempted: attempted,
      questions_correct: correctTotal,
      last_studied_at: new Date().toISOString(),
    });
  }
}
