import { motion } from "framer-motion";
import { Flame, Star, Zap, Award, BookOpen, Brain, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

const badgeDefinitions = [
  { icon: Flame, label: "3-Day Streak", desc: "Study 3 days in a row", color: "text-orange-500", check: (p: any) => (p?.streak_days || 0) >= 3 },
  { icon: Star, label: "First Upload", desc: "Upload your first document", color: "text-yellow-500", check: (_p: any, docs: number) => docs > 0 },
  { icon: Zap, label: "50 XP", desc: "Earn 50 XP", color: "text-primary", check: (p: any) => (p?.xp || 0) >= 50 },
  { icon: Award, label: "Topic Master", desc: "Master any topic to 75%+", color: "text-secondary", check: (_p: any, _d: number, masteredCount: number) => masteredCount > 0 },
  { icon: BookOpen, label: "Bookworm", desc: "Upload 10 documents", color: "text-green-500", check: (_p: any, docs: number) => docs >= 10 },
  { icon: Brain, label: "Big Brain", desc: "Reach Level 5", color: "text-purple-500", check: (p: any) => (p?.level || 1) >= 5 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Rewards = () => {
  const { profile, user } = useAuth();
  const [docCount, setDocCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const streakDays = profile?.streak_days || 0;
  const xpForNext = level * 100;
  const xpProgress = Math.min((xp % xpForNext) / xpForNext * 100, 100);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const { count: dc } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setDocCount(dc || 0);

      const { count: mc } = await supabase
        .from("study_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("mastery_pct", 75);
      setMasteredCount(mc || 0);
    };
    fetchCounts();
  }, [user]);

  const badges = badgeDefinitions.map((b) => ({
    ...b,
    earned: b.check(profile, docCount, masteredCount),
  }));

  // Build streak days for current week
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1;
  const streakDaysArr = dayLabels.map((day, i) => ({
    day,
    active: i <= todayIdx && i > todayIdx - streakDays,
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <Helmet><title>Rewards · VISU</title></Helmet>
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
        <p className="text-sm text-muted-foreground mt-1">Keep learning to earn XP and unlock badges! 🏆</p>
      </motion.div>

      {/* XP Card */}
      <motion.div variants={item} className="relative overflow-hidden gradient-primary rounded-2xl p-6 text-primary-foreground">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-2 right-4 text-5xl opacity-20">🏆</div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium opacity-80">Your Level</span>
          </div>
          <p className="text-4xl font-bold">{xp} XP</p>
          <p className="text-sm opacity-80 mt-0.5">Level {level}</p>
          <div className="h-2.5 bg-primary-foreground/20 rounded-full mt-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary-foreground/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="text-xs mt-1.5 opacity-60">{xpForNext - (xp % xpForNext)} XP to Level {level + 1}</p>
        </div>
      </motion.div>

      {/* Streak Tracker */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Weekly Streak</h2>
          <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
            <Flame className="h-4 w-4" /> {streakDays} day{streakDays !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex justify-between">
          {streakDaysArr.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: 0.3 }}
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                  d.active ? "gradient-warm shadow-sm" : "bg-muted"
                }`}
              >
                {d.active ? "🔥" : ""}
              </motion.div>
              <span className={`text-[10px] font-medium ${d.active ? "text-foreground" : "text-muted-foreground"}`}>{d.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Badges</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className={`bg-card rounded-2xl p-4 shadow-card text-center relative overflow-hidden ${
                !b.earned ? "opacity-50" : ""
              }`}
            >
              {b.earned && <div className="absolute top-2 right-2 text-xs">✅</div>}
              <motion.div whileHover={b.earned ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}>
                <b.icon className={`h-8 w-8 mx-auto ${b.earned ? b.color : "text-muted-foreground"}`} />
              </motion.div>
              <p className="text-sm font-semibold text-foreground mt-2">{b.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Rewards;
