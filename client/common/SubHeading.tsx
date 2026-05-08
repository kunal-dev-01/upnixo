import React from "react";

interface SubHeadingProps {
  title: string;
  description?: string;
  // Icon ko as a component lene ke liye 'ElementType' ka use karte hain
  icon: React.ElementType;
  iconBgColor?: string; // e.g., "bg-blue-100" ya "bg-orange-500/10"
  iconClassName?: string; // Icon ke size ya color ke liye
  className?: string;
}

const SubHeading: React.FC<SubHeadingProps> = ({
  title,
  description,
  icon: Icon, // Capital 'I' kyunki hum ise component ki tarah use karenge
  iconBgColor = "bg-zinc-100 dark:bg-zinc-800",
  iconClassName = "text-zinc-700 dark:text-zinc-300",
  className = "",
}) => {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Icon Container */}
      <div className={`shrink-0 p-2.5 rounded-xl ${iconBgColor}`}>
        <Icon className={`w-6 h-6 ${iconClassName}`} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-0.5">
        <h2 className="lg:text-xl text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SubHeading;
