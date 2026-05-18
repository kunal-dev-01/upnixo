import { FOOTER_LINKS, NAV_LINKS } from "@/utils/constants";
import Link from "next/link";
import { motion } from "framer-motion";
import BrandingSection from "./BrandSection";

const MotionLink = motion.create(Link);
export const WavyText = ({ name }: { name: string }) => (
  <div className="relative flex overflow-hidden whitespace-nowrap">
    {/* Top Text */}
    <div className="flex">
      {name.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={{
            initial: { y: 0 },
            hover: { y: "-100%" },
          }}
          transition={{
            duration: 0.3,
            ease: [0.33, 1, 0.68, 1],
            delay: index * 0.01,
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
    {/* Bottom Text */}
    <div className="absolute inset-0 flex">
      {name.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={{
            initial: { y: "100%" },
            hover: { y: 0 },
          }}
          transition={{
            duration: 0.3,
            ease: [0.33, 1, 0.68, 1],
            delay: index * 0.01,
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  </div>
);

function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-12">
      <div className="w-full lg:px-10 px-5 flex flex-col md:flex-row justify-between gap-10">
        {/* Section 1: Brand */}
        <div className="flex flex-col gap-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">
            Precision-engineered backends. Zero compromises on performance,
            security, or scale.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-10 md:gap-20">
          {/* Section 2: Navigation (Wavy Effect) */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
              Navigation
            </h3>
            <ul className="flex flex-col gap-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.name}>
                  <MotionLink
                    href={link.href}
                    initial="initial"
                    whileHover="hover"
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-1 inline-block"
                  >
                    <WavyText name={link.name} />
                  </MotionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Company (Wavy Effect + Terms added) */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
              Company
            </h3>
            <ul className="flex flex-col gap-y-1">
              {FOOTER_LINKS.map((item) => (
                <li key={item.name}>
                  <MotionLink
                    href={item.href}
                    initial="initial"
                    whileHover="hover"
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-1 inline-block"
                  >
                    <WavyText name={item.name} />
                  </MotionLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="opacity-[0.04] w-full lg:px-10 px-5">
        <BrandingSection />
      </div>

      {/* Bottom Section */}
      <div className="w-full lg:px-10 px-5 pt-8 flex flex-col md:flex-row justify-between items-center gap-y-4">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Pnixo. All rights reserved.
        </p>

        <div className="flex items-center gap-x-6">
          {/* All Systems Operational Badge */}
          <div className="flex items-center gap-x-2 px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-500/10 border border-zinc-100 dark:border-zinc-500/20">
            {/* Pulse Dot */}
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
