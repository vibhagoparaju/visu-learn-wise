import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Upload, Layers, BarChart3, Sparkles } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/flashcards", icon: Layers, label: "Cards" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <>
      <header className="md:hidden flex items-center gap-2.5 p-3 border-b border-border glass sticky top-0 z-40">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <GlobalSearch />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-6 gradient-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default MobileNav;
