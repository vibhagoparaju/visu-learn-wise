import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TopicMindMap from "@/components/visual/TopicMindMap";
import TopicCards from "@/components/visual/TopicCards";
import InfographicLesson from "@/components/visual/InfographicLesson";
import LearningHub from "@/components/visual/LearningHub";
import { Network, LayoutGrid, FileImage, Play, Loader2 } from "lucide-react";

type Tab = "mindmap" | "cards" | "infographic" | "hub";

const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: "mindmap", label: "Mind Map", icon: Network, desc: "See how topics connect" },
  { id: "cards", label: "Topic Cards", icon: LayoutGrid, desc: "Visual summaries" },
  { id: "infographic", label: "Infographics", icon: FileImage, desc: "Visual lessons" },
  { id: "hub", label: "Learning Hub", icon: Play, desc: "Resources & media" },
];

interface TopicData {
  topic: string;
  mastery_pct: number | null;
  strength: string | null;
  last_studied_at: string | null;
}

const VisualEducation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("mindmap");
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [progressRes, docsRes] = await Promise.all([
        supabase.from("study_progress").select("topic, mastery_pct, strength, last_studied_at").eq("user_id", user.id),
        supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setTopics(progressRes.data || []);
      setDocuments(docsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleStudyTopic = (topic: string) => {
    navigate(`/study/${encodeURIComponent(topic)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Visual Education</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore your knowledge visually — maps, cards, infographics & more
        </p>
      </motion.div>

      {/* Tab Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent border border-border"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "mindmap" && (
            <TopicMindMap topics={topics} documents={documents} onStudyTopic={handleStudyTopic} />
          )}
          {activeTab === "cards" && (
            <TopicCards topics={topics} documents={documents} onStudyTopic={handleStudyTopic} />
          )}
          {activeTab === "infographic" && (
            <InfographicLesson topics={topics} onStudyTopic={handleStudyTopic} />
          )}
          {activeTab === "hub" && (
            <LearningHub topics={topics} documents={documents} onStudyTopic={handleStudyTopic} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VisualEducation;
