import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  BarChart3,
  Trophy,
  Settings,
  Sparkles,
  Clock,
  Layers,
  HelpCircle,
  Bookmark,
} from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";

const navGroups = [
  {
    label: "Learn",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/study", icon: BookOpen, label: "Study" },
      { to: "/upload", icon: Upload, label: "Upload" },
    ],
  },
  {
    label: "Review",
    items: [
      { to: "/flashcards", icon: Layers, label: "Flashcards" },
      { to: "/quiz", icon: HelpCircle, label: "Quiz" },
    ],
  },
  {
    label: "Track",
    items: [
      { to: "/progress", icon: BarChart3, label: "Progress" },
      { to: "/history", icon: Clock, label: "History" },
      { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
      { to: "/rewards", icon: Trophy, label: "Rewards" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/50 backdrop-blur-sm min-h-screen p-4">
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <span className="text-lg font-bold text-gradient font-display">VISU</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5">AI Tutor</p>
        </div>
      </div>

      <div className="px-1 mb-5">
        <GlobalSearch />
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="h-px bg-border mx-3 my-2" />}
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-accent rounded-xl border border-primary/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <item.icon
                    className={`h-4 w-4 relative z-10 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`relative z-10 transition-colors ${
                      isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;
