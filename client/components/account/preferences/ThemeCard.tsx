import { useState } from "react";
import { Check } from "@/svg/Common";
import { Loader } from "@/common/Loader";

interface Theme {
  id: string;
  name: string;
  image: string;
  overlayColor: string;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
}

export function ThemeSelector({
  themes,
  selectedTheme,
  onThemeSelect,
}: ThemeSelectorProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  if (!themes || themes.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            isHovered={hoveredTheme === theme.id}
            onSelect={() => onThemeSelect(theme.id)}
            onHover={setHoveredTheme}
          />
        ))}
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (themeId: string | null) => void;
}

function ThemeCard({
  theme,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: ThemeCardProps) {
  return (
    <div
      className="group flex flex-col items-center cursor-pointer w-full"
      onClick={onSelect}
      onMouseEnter={() => onHover(theme.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Preview Container */}
      <div
        className={`
          relative 
          aspect-17/10 
          w-full 
          rounded-2xl 
          overflow-hidden 
          border-2 
          transition-all 
          duration-300
          ${
            isSelected
              ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          }
        `}
      >
        {/* The Image */}
        <img
          src={theme.image}
          alt={theme.name}
          className="w-full h-full object-cover"
        />

        {/* Hover/Selection Overlay */}
        <div
          className={`
            absolute inset-0 
            ${theme.overlayColor} 
            backdrop-blur-xs will-change-transform transform-gpu
            flex items-center justify-center
            transition-all duration-300 ease-out
            ${
              isHovered || isSelected
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90"
            }
          `}
        >
          <div
            className={`
              p-2 rounded-full bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800
              transition-transform duration-500
              ${isHovered || isSelected ? "rotate-0 scale-100" : "-rotate-12 scale-50"}
            `}
          >
            <Check
              className={`w-5 h-5 ${isSelected ? "text-indigo-500" : "text-zinc-400"}`}
            />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 mt-3">
        <span
          className={`
            text-sm font-semibold transition-colors duration-200
            ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"}
          `}
        >
          {theme.name}
        </span>
      </div>
    </div>
  );
}

export default ThemeSelector;
