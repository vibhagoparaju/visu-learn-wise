import { supabase } from "@/integrations/supabase/client";

interface PlanTask {
  text: string;
  done: boolean;
  topicId?: string;
  type: "review" | "learn" | "practice";
}

export async function generateDailyPlan(userId: string): Promise<PlanTask[]> {
  const tasks: PlanTask[] = [];

  // Fetch weak topics, recent docs, and due flashcard count in parallel
  const [weakRes, recentRes, dueCardsRes] = await Promise.all([
    supabase
      .from("study_progress")
      .select("*")
      .eq("user_id", userId)
      .lt("mastery_pct", 60)
      .order("mastery_pct", { ascending: true })
      .limit(3),
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString()),
  ]);

  const weakTopics = weakRes.data;
  const recentDocs = recentRes.data;
  const dueCardCount = dueCardsRes.count || 0;

  // Add quick revision task if due cards exist
  if (dueCardCount > 0) {
    tasks.push({
      text: `Quick revision: ${dueCardCount} flashcard${dueCardCount !== 1 ? "s" : ""} due`,
      done: false,
      type: "review",
    });
  }

  // Add weak topic reviews
  if (weakTopics && weakTopics.length > 0) {
    for (const topic of weakTopics.slice(0, 2)) {
      tasks.push({
        text: `Review: ${topic.topic}${topic.subtopic ? ` — ${topic.subtopic}` : ""} (${topic.mastery_pct}%)`,
        done: false,
        topicId: topic.id,
        type: "review",
      });
    }
  }

  // Add new topics from recent uploads
  if (recentDocs) {
    for (const doc of recentDocs) {
      const topics = (doc.topics as string[]) || [];
      for (const topic of topics.slice(0, 2)) {
        const { count } = await supabase
          .from("study_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("topic", topic);

        if (!count || count === 0) {
          tasks.push({
            text: `Learn: ${topic}`,
            done: false,
            type: "learn",
          });
        }
      }
      if (tasks.length >= 5) break;
    }
  }

  // Add a practice task if user has some progress
  if (weakTopics && weakTopics.length > 0) {
    tasks.push({
      text: `Practice: Quiz on your weak areas`,
      done: false,
      type: "practice",
    });
  }

  // Fallback
  if (tasks.length === 0) {
    tasks.push({
      text: "Upload study material or ask AI a question to get started",
      done: false,
      type: "learn",
    });
  }

  return tasks.slice(0, 6);
}

export async function saveDailyPlan(userId: string, tasks: PlanTask[]) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("plan_date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("study_plans")
      .update({ tasks: tasks as any })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        plan_date: today,
        tasks: tasks as any,
      });
  }
}
