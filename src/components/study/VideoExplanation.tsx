import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Loader2, AlertCircle, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoSuggestion {
  title: string;
  channel: string;
  searchQuery: string;
  duration: string;
  keyPoints: string[];
}

interface VideoExplanationProps {
  content: string;
  topic?: string;
}

const VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-videos`;

const VideoExplanation = ({ content, topic }: VideoExplanationProps) => {
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    setHasRequested(true);

    try {
      const resp = await fetch(VIDEO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topic: topic || content.split(/[.!?]/)[0]?.trim().slice(0, 100) || "this topic",
          explanation: content.replace(/[#*_]/g, "").slice(0, 400),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      setVideos(data.videos || []);
    } catch (e: any) {
      setError(e.message || "Failed to find videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasRequested) {
      fetchVideos();
    }
  }, []);

  const openYouTube = (query: string) => {
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      "_blank"
    );
  };

  if (!hasRequested || loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-8 gap-3"
      >
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Finding educational videos…
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchVideos} className="rounded-lg">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Try again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {videos.map((video, idx) => (
        <motion.button
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => openYouTube(video.searchQuery)}
          className="w-full text-left bg-muted/50 hover:bg-accent rounded-xl p-3.5 border border-border hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
              <Play className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{video.channel}</span>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {video.duration}
                </span>
              </div>
              {video.keyPoints?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {video.keyPoints.slice(0, 3).map((point, pi) => (
                    <div key={pi} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
          </div>
        </motion.button>
      ))}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchVideos}
          disabled={loading}
          className="text-xs rounded-lg"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Find more
        </Button>
      </div>
    </motion.div>
  );
};

export default VideoExplanation;
