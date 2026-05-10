"use client";
import React, { useState } from "react";

interface Theme {
  id: string;
  name: string;
  preview: React.ReactNode;
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

  return (
    <div className="w-full">
      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Tablet */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-6 md:hidden">
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

      {/* Mobile */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            isHovered={hoveredTheme === theme.id}
            onSelect={() => onThemeSelect(theme.id)}
            onHover={setHoveredTheme}
            size="large"
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
  size?: "default" | "large";
}

function ThemeCard({
  theme,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  size = "default",
}: ThemeCardProps) {
  return (
    <div
      className={`
        flex 
        flex-col 
        items-center 
        cursor-pointer 
        transition-all 
        duration-200
        ${isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"}
      `}
      onClick={onSelect}
      onMouseEnter={() => onHover(theme.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Preview Container */}
      <div
        className={`
          border-border_default 
          border 
          flex 
          items-center 
          justify-center 
          rounded-[12px] 
          w-full 
          overflow-hidden 
          transition-all 
          duration-200
          [&>svg]:w-full 
          [&>svg]:h-auto
          ${
            isSelected
              ? "border-primary border-2 shadow-lg shadow-primary/20"
              : isHovered
                ? "border-border_hover shadow-md"
                : ""
          }
        `}
      >
        <div className={size === "large" ? "w-full" : "w-full"}>
          {theme.preview}
        </div>
      </div>

      {/* Label */}
      <div
        className={`
          flex 
          items-center 
          gap-2 
          mt-3
          ${isSelected ? "text-primary" : "text-text_default_tertiary"}
          transition-colors 
          duration-200
        `}
      >
        <div className="w-5 h-5">
          {isSelected ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM9.99 16.54L4.62 11.17L6.24 9.55L9.99 13.31L16.77 6.53L18.39 8.15L9.99 16.54Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 15.8486C10.3672 15.8486 10.6649 16.1465 10.665 16.5137V18.375C10.665 18.7423 10.3673 19.04 10 19.04C9.63273 19.04 9.33496 18.7423 9.33496 18.375V16.5137C9.33508 16.1465 9.6328 15.8486 10 15.8486ZM4.92383 14.1357C5.18353 13.8761 5.60458 13.8761 5.86426 14.1357C6.12394 14.3954 6.1239 14.8165 5.86426 15.0762L4.54785 16.3926C4.28813 16.6519 3.86701 16.6522 3.60742 16.3926C3.34784 16.133 3.34807 15.7119 3.60742 15.4521L4.92383 14.1357ZM14.1357 14.1357C14.3954 13.8761 14.8165 13.8761 15.0762 14.1357L16.3926 15.4521C16.6519 15.7119 16.6522 16.133 16.3926 16.3926C16.133 16.6522 15.7119 16.6519 15.4521 16.3926L14.1357 15.0762C13.8761 14.8165 13.8761 14.3954 14.1357 14.1357ZM10 5.34668C12.5697 5.34678 14.6532 7.43031 14.6533 10C14.6532 12.5697 12.5697 14.6532 10 14.6533C7.43031 14.6532 5.34678 12.5697 5.34668 10C5.34678 7.43031 7.43031 5.34678 10 5.34668ZM10 6.67676C8.16485 6.67686 6.67686 8.16485 6.67676 10C6.67686 11.8351 8.16485 13.3231 10 13.3232C11.8351 13.3231 13.3231 11.8351 13.3232 10C13.3231 8.16485 11.8351 6.67686 10 6.67676ZM3.48633 9.33496C3.8535 9.33508 4.15137 9.6328 4.15137 10C4.15137 10.3672 3.8535 10.6649 3.48633 10.665H1.625C1.25773 10.665 0.959961 10.3673 0.959961 10C0.959961 9.63273 1.25773 9.33496 1.625 9.33496H3.48633ZM18.375 9.33496C18.7423 9.33496 19.04 9.63273 19.04 10C19.04 10.3673 18.7423 10.665 18.375 10.665H16.5137C16.1465 10.6649 15.8486 10.3672 15.8486 10C15.8486 9.6328 16.1465 9.33508 16.5137 9.33496H18.375ZM3.60742 3.60742C3.86701 3.34784 4.28813 3.34807 4.54785 3.60742L5.86426 4.92383C6.1239 5.18353 6.12394 5.60458 5.86426 5.86426C5.60458 6.12394 5.18353 6.1239 4.92383 5.86426L3.60742 4.54785C3.34807 4.28813 3.34784 3.86701 3.60742 3.60742ZM15.4521 3.60742C15.7119 3.34807 16.133 3.34784 16.3926 3.60742C16.6522 3.86701 16.6519 4.28813 16.3926 4.54785L15.0762 5.86426C14.8165 6.1239 14.3954 6.12394 14.1357 5.86426C13.8761 5.60458 13.8761 5.18353 14.1357 4.92383L15.4521 3.60742ZM10 0.959961C10.3673 0.959961 10.665 1.25773 10.665 1.625V3.48633C10.6649 3.8535 10.3672 4.15137 10 4.15137C9.6328 4.15137 9.33508 3.8535 9.33496 3.48633V1.625C9.33496 1.25773 9.63273 0.959961 10 0.959961Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        <span
          className={`
            text-[14px] 
            font-medium
            ${isSelected ? "text-primary" : "text-text_default_tertiary"}
          `}
        >
          {theme.name}
        </span>
      </div>
    </div>
  );
}

// Default Light Theme Preview
export function LightThemePreview() {
  return (
    <svg
      width="210"
      height="120"
      viewBox="0 0 210 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="210" height="120" fill="white" />
      <g filter="url(#filter0_d_light)">
        <path
          d="M20 29.2768C20 24.7845 23.6417 21.1428 28.134 21.1428H181.866C186.358 21.1428 190 24.7845 190 29.2768V90.7231C190 95.2154 186.358 98.8571 181.866 98.8571H28.134C23.6417 98.8571 20 95.2154 20 90.7231V29.2768Z"
          fill="white"
        />
        <path
          d="M28.1338 21.3459H181.866C186.246 21.346 189.797 24.8968 189.797 29.2766V90.7229C189.797 95.1028 186.246 98.6535 181.866 98.6536H28.1338C23.7539 98.6535 20.2031 95.1028 20.2031 90.7229V29.2766C20.2032 24.8968 23.754 21.346 28.1338 21.3459Z"
          stroke="#0A0A0A"
          strokeOpacity="0.08"
          strokeWidth="0.406699"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_light"
          x="11.866"
          y="13.0089"
          width="186.268"
          height="93.9823"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="4.06699" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

// Default Dark Theme Preview
export function DarkThemePreview() {
  return (
    <svg
      width="210"
      height="120"
      viewBox="0 0 210 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="210" height="120" fill="#121212" />
      <g filter="url(#filter0_d_dark)">
        <path
          d="M20 29.2768C20 24.7845 23.6417 21.1428 28.134 21.1428H181.866C186.358 21.1428 190 24.7845 190 29.2768V90.7231C190 95.2154 186.358 98.8571 181.866 98.8571H28.134C23.6417 98.8571 20 95.2154 20 90.7231V29.2768Z"
          fill="#1E1E1E"
        />
        <path
          d="M28.1338 21.3459H181.866C186.246 21.346 189.797 24.8968 189.797 29.2766V90.7229C189.797 95.1028 186.246 98.6535 181.866 98.6536H28.1338C23.7539 98.6535 20.2031 95.1028 20.2031 90.7229V29.2766C20.2032 24.8968 23.754 21.346 28.1338 21.3459Z"
          stroke="#0A0A0A"
          strokeOpacity="0.3"
          strokeWidth="0.406699"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_dark"
          x="11.866"
          y="13.0089"
          width="186.268"
          height="93.9823"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="4.06699" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

// System Theme Preview
export function SystemThemePreview() {
  return (
    <svg
      width="210"
      height="120"
      viewBox="0 0 210 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="105" height="120" fill="white" />
      <rect x="105" width="105" height="120" fill="#121212" />
      <g filter="url(#filter0_d_system)">
        <path
          d="M20 29.2768C20 24.7845 23.6417 21.1428 28.134 21.1428H181.866C186.358 21.1428 190 24.7845 190 29.2768V90.7231C190 95.2154 186.358 98.8571 181.866 98.8571H28.134C23.6417 98.8571 20 95.2154 20 90.7231V29.2768Z"
          fill="url(#gradient_system)"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_system"
          x="11.866"
          y="13.0089"
          width="186.268"
          height="93.9823"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="4.06699" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0.08 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <linearGradient
          id="gradient_system"
          x1="20"
          y1="60"
          x2="190"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#F5F5F5" />
          <stop offset="1" stopColor="#1E1E1E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Pre-built theme options
export const defaultThemes: Theme[] = [
  {
    id: "light",
    name: "Light",
    preview: <LightThemePreview />,
  },
  {
    id: "dark",
    name: "Dark",
    preview: <DarkThemePreview />,
  },
  {
    id: "system",
    name: "System",
    preview: <SystemThemePreview />,
  },
];

export default ThemeSelector;
