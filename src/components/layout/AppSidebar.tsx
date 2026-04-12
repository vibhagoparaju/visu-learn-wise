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
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/rewards", icon: Trophy, label: "Rewards" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen p-4">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-gradient">VISU</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 relative z-10 ${
                  isActive ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              />
              <span
                className={`relative z-10 ${
                  isActive ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto p-3 rounded-xl gradient-accent">
        <p className="text-xs font-semibold text-accent-foreground">Phase 1 – MVP</p>
        <p className="text-xs text-muted-foreground mt-1">AI Tutor • Upload • Dashboard</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
