export default function BrandingSection() {
  return (
    <div className="w-full lg:px-10 px-5 py-10 lg:pt-5 mx-auto overflow-hidden">
      <div className="relative flex justify-center items-center select-none cursor-default">
        <div className="relative flex items-center justify-center">
          <div className="w-[7vh] sm:w-[15vw] md:w-[15vw] lg:w-[19vw] flex items-center">
            <svg
              viewBox="0 0 629 934"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                className="fill-zinc-900 dark:fill-white"
                d="M0 61.98C0 27.7494 27.7494 0 61.98 0C96.2106 0 123.96 27.7494 123.96 61.98V587.279C123.96 609.37 106.051 627.279 83.9599 627.279H0V61.98Z"
              />
              <path
                className="fill-zinc-900 dark:fill-white"
                d="M455.7 86.1816C455.7 38.5848 494.285 0 541.882 0C589.479 0 628.064 38.5848 628.064 86.1816V627.279H545.7C495.995 627.279 455.7 586.985 455.7 537.279V86.1816Z"
              />
              <path
                className="fill-zinc-900 dark:fill-white"
                d="M314.032 320.558C487.467 320.558 628.063 457.882 628.063 627.279C628.063 796.676 487.467 934 314.032 934C140.597 934 0.000168907 796.676 0 627.279C0 457.882 140.597 320.558 314.032 320.558ZM314 459C238.889 459 178 533.992 178 626.5C178 719.008 238.889 794 314 794C389.111 794 450 719.008 450 626.5C450 533.992 389.111 459 314 459Z"
              />
            </svg>
          </div>

          {/* Text */}
          <h1 className="text-[25vw] sm:text-[27vw] md:text-[27vw] lg:text-[29vw] leading-none font-black tracking-tighter capitalize">
            pnixo
          </h1>
        </div>
      </div>
    </div>
  );
}
