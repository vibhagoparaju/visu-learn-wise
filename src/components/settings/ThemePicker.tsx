import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

interface ThemePickerProps {
  value?: Theme;
  onChange?: (t: Theme) => void;
  /** When true, selecting a theme only previews via the prop, doesn't apply globally */
  previewOnly?: boolean;
}

const ThemePicker = ({ value, onChange, previewOnly = false }: ThemePickerProps) => {
  const { theme, setTheme, themes } = useTheme();
  const active = value ?? theme;

  const handleSelect = (id: Theme) => {
    onChange?.(id);
    if (!previewOnly) setTheme(id);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {themes.map((t) => {
        const selected = active === t.id;
        return (
          <motion.button
            key={t.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(t.id)}
            className={`relative text-left rounded-2xl border p-3 transition-all ${
              selected
                ? "border-primary shadow-glow bg-accent/40"
                : "border-border bg-muted/40 hover:border-primary/40"
            }`}
            aria-pressed={selected}
          >
            {/* Mini preview */}
            <div
              className="h-16 w-full rounded-xl overflow-hidden flex items-stretch shadow-card"
              style={{ background: t.swatches[0] }}
            >
              <div className="flex-1 flex items-end p-2">
                <div
                  className="h-2 w-10 rounded-full"
                  style={{ background: t.swatches[2] }}
                />
              </div>
              <div
                className="w-1/3 flex items-center justify-center"
                style={{ background: t.swatches[1] }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: t.swatches[2] }}
                />
              </div>
            </div>

            <div className="mt-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                  {t.tagline}
                </p>
              </div>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
