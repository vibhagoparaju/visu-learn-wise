import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actions?: { label: string; onClick: () => void; variant?: "gradient" | "outline" }[];
}

const EmptyState = ({ icon: Icon, emoji, title, description, actions }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center text-center py-16 px-6"
  >
    <div className="relative mb-6">
      <div className="h-20 w-20 rounded-2xl bg-accent flex items-center justify-center">
        {emoji ? (
          <span className="text-4xl">{emoji}</span>
        ) : (
          <Icon className="h-9 w-9 text-primary/60" />
        )}
      </div>
      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full gradient-primary opacity-40 blur-sm" />
    </div>
    <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    {actions && actions.length > 0 && (
      <div className="flex gap-2 mt-5">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.variant || "gradient"}
            size="sm"
            className="rounded-full px-5"
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        ))}
      </div>
    )}
  </motion.div>
);

export default EmptyState;
