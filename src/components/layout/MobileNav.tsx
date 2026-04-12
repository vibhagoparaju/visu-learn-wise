import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Upload, BarChart3, Sparkles } from "lucide-react";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <>
      <header className="md:hidden flex items-center gap-2 p-4 border-b border-border bg-card">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-gradient">VISU</span>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
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
