import { BookOpen, Eye, Brain } from "lucide-react";

export type ViewMode = "explain" | "visual" | "retain";

interface MessageViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const views: { key: ViewMode; label: string; icon: typeof BookOpen }[] = [
  { key: "explain", label: "Explain", icon: BookOpen },
  { key: "visual", label: "Visual", icon: Eye },
  { key: "retain", label: "Retain", icon: Brain },
];

const MessageViewToggle = ({ activeView, onViewChange }: MessageViewToggleProps) => (
  <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 w-fit">
    {views.map(({ key, label, icon: Icon }) => (
      <button
        key={key}
        onClick={() => onViewChange(key)}
        className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
          activeView === key
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    ))}
  </div>
);

export default MessageViewToggle;
