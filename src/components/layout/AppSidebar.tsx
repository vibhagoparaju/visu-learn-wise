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
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/rewards", icon: Trophy, label: "Rewards" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm min-h-screen p-4">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="text-xl font-bold text-gradient font-display">VISU</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5">Personal AI Tutor</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent rounded-xl border border-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 relative z-10 transition-colors ${
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
      </nav>

      <div className="p-4 rounded-2xl gradient-primary text-primary-foreground">
        <p className="text-xs font-semibold opacity-90">🚀 Pro Tip</p>
        <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
          Upload your notes to get AI-powered summaries and quizzes!
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
