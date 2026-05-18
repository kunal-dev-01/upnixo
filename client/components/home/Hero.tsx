export default function Hero() {
  const desktoplines = ["Your Codebase.Your Data.", "My Accountability."];
  const mobileLines = ["Your Codebase.", "Your Data.", "My Accountability."];
  const subheading =
    "Senior Go engineer delivering high-performance backends, encrypted systems, and milestone-based projects — with zero tracking and full transparency.";

  return (
    <div className="w-full lg:min-h-screen min-h-[70vh] relative overflow-hidden fade-in">
      <div
        id="hover-effect"
        className="absolute inset-0 w-full min-h-screen -z-10 pointer-events-none transition-all duration-500 flex items-center justify-center"
      >
        {/* 1. Indigo Gradient Circle (Sabse piche: -z-20) */}
        <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-indigo-600/25 blur-[100px] md:blur-[150px] -z-20" />

        {/* 2. Aapki Pattern Image (Circle ke upar: -z-10) */}
        <img
          src="/pattern.svg"
          alt="pattern"
          className="w-full h-full object-cover -z-10"
        />
      </div>

      <div className="w-full lg:min-h-screen flex flex-col items-center justify-center py-20 lg:px-10 px-5">
        <div className="text-center">
          {desktoplines.map((line) => (
            <h1
              key={line}
              className="lg:text-8xl md:text-6xl font-black text-center hidden md:block"
            >
              {line}
            </h1>
          ))}

          {mobileLines.map((line) => (
            <h1
              key={line}
              className="text-4xl sm:text-5xl font-black text-center md:hidden"
            >
              {line}
            </h1>
          ))}
        </div>

        <div className="lg:mt-10 mt-5 lg:max-w-3xl md:max-w-2xl max-w-sm">
          <p className="text-center lg:text-lg md:text-md text-base font-medium">
            {subheading}
          </p>
        </div>
      </div>
    </div>
  );
}
