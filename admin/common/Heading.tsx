import React from "react";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
}

const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  className = "",
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="lg:text-3xl text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="lg:text-lg text-base text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default Heading;
