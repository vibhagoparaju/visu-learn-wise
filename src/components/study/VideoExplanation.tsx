import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Loader2, AlertCircle, RefreshCw, Clock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchVideos } from "@/services/ai";

interface VideoSuggestion {
  title: string;
  channel: string;
  videoId: string | null;
  thumbnail: string;
  searchQuery: string;
  duration: string;
  keyPoints: string[];
}

interface VideoExplanationProps {
  content: string;
  topic?: string;
}

const VideoExplanation = ({ content, topic }: VideoExplanationProps) => {
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const fetchVideoList = async () => {
    setLoading(true);
    setError(null);
    setHasRequested(true);
    setPlayingIdx(null);

    try {
      const data = await searchVideos(
        topic || content.split(/[.!?]/)[0]?.trim().slice(0, 100) || "this topic",
        content.replace(/[#*_]/g, "").slice(0, 400)
      );
      setVideos((data.videos || []) as VideoSuggestion[]);
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

  const getEmbedUrl = (video: VideoSuggestion) => {
    if (video.videoId) {
      return `https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`;
    }
    return null;
  };

  const openYouTube = (video: VideoSuggestion) => {
    if (video.videoId) {
      window.open(`https://www.youtube.com/watch?v=${video.videoId}`, "_blank");
    } else {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`,
        "_blank"
      );
    }
  };

  const playVideo = (idx: number) => {
    const video = videos[idx];
    if (video.videoId) {
      setPlayingIdx(idx);
      setIframeLoading(true);
      setIframeError(false);
    } else {
      openYouTube(video);
    }
  };

  const closePlayer = () => {
    setPlayingIdx(null);
    setIframeLoading(false);
    setIframeError(false);
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

  const activeVideo = playingIdx !== null ? videos[playingIdx] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Embedded Video Player */}
      {activeVideo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl overflow-hidden border border-border bg-card shadow-card"
        >
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <p className="text-xs font-medium text-foreground truncate flex-1 mr-2">
              {activeVideo.title}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={() => openYouTube(activeVideo)}
                title="Open on YouTube"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={closePlayer}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}

            {iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 gap-2">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Video cannot be embedded</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openYouTube(activeVideo)}
                  className="text-xs rounded-lg"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Watch on YouTube
                </Button>
              </div>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={getEmbedUrl(activeVideo)!}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIframeLoading(false)}
                onError={() => {
                  setIframeLoading(false);
                  setIframeError(true);
                }}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Video List */}
      {videos.map((video, idx) => (
        <motion.button
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => playVideo(idx)}
          className={`w-full text-left rounded-xl p-3 border transition-all group ${
            playingIdx === idx
              ? "bg-primary/5 border-primary/30"
              : "bg-muted/50 hover:bg-accent border-border hover:border-primary/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Thumbnail or Play Icon */}
            {video.thumbnail ? (
              <div className="relative h-16 w-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                <Play className="h-4 w-4 text-destructive" />
              </div>
            )}

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

            {video.videoId ? (
              <span className="text-[10px] text-primary font-medium flex-shrink-0 mt-1">▶ Play</span>
            ) : (
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
            )}
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
