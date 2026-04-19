import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Library, Layers, BarChart3 } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import puppyIcon from "@/assets/visu-puppy-icon.jpeg";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/syllabus", icon: Library, label: "Syllabus" },
  { to: "/flashcards", icon: Layers, label: "Cards" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <>
      <header className="md:hidden flex items-center gap-2.5 p-3 border-b border-border glass sticky top-0 z-40">
        <div className="h-8 w-8 rounded-lg overflow-hidden bg-card flex items-center justify-center ring-1 ring-border flex-shrink-0">
          <img src={puppyIcon} alt="VISU mascot" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1">
          <GlobalSearch />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
        {items.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
