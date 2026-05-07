import Image from "next/image";
import logo from "@/public/logo.svg";
import Link from "next/link";
import { Sidebar } from "@/svg/Common";
import { motion } from "framer-motion";
import { NAV_LINKS } from "@/utils/constants";

interface NavbarProps {
  onOpenSidebar: () => void;
}

function Navbar({ onOpenSidebar }: NavbarProps) {

  return (
    <div className="w-fit flex items-center justify-center md:gap-x-3 gap-x-5 py-2 h-12 border border-zinc-100 dark:border-zinc-900 rounded-full pl-4 pr-1 backdrop-blur-lg bg-zinc-50/50 dark:bg-zinc-950/50">
      <Link
        aria-label="Logo"
        href={"/"}
        className="flex items-center justify-center select-none"
      >
        <Image
          src={logo}
          alt="Logo"
          className="size-6"
          loading="eager"
          priority
          width={40}
          height={40}
        />
        <h1 className="text-2xl font-bold">Pnixo</h1>
      </Link>

      <nav
        aria-label="Navigation"
        className="hidden md:flex items-center gap-1 relative px-2"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="relative px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full"
          >
            <motion.div
              initial="initial"
              whileHover="hover"
              className="relative flex overflow-hidden whitespace-nowrap"
            >
              {/* Top Text - Goes Up */}
              <div className="flex">
                {link.name.split("").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      initial: { y: 0 },
                      hover: { y: "-100%" },
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.33, 1, 0.68, 1],
                      delay: index * 0.02, 
                    }}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>

              {/* Bottom Text - Comes from Below */}
              <div className="absolute inset-0 flex">
                {link.name.split("").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      initial: { y: "100%" },
                      hover: { y: 0 },
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.33, 1, 0.68, 1],
                      delay: index * 0.02, // Syncs with the top text
                    }}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </Link>
        ))}
      </nav>

      <div
        aria-label="desktop-auth"
        className="hidden lg:flex items-center justify-center gap-3"
      >
        <Link
          href="/auth/login"
          className="text-sm font-medium bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-full cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300 ease-in-out"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="text-sm font-semibold  px-4 py-2 rounded-full border-2 border-indigo-600 text-zinc-800 dark:text-white hover:text-white transition-all duration-300 ease-in-out relative group cursor-pointer"
        >
          <span>Start a Project</span>
          <div className="absolute inset-0 bg-indigo-600 rounded-full scale-80 opacity-0 -z-10 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-in-out"></div>
        </Link>
      </div>

      <div
        aria-label="mobile-auth"
        className="lg:hidden flex items-center gap-2"
      >
        <Link
          href="/auth/register"
          className="text-sm font-semibold  px-4 py-2 rounded-full border-2 border-indigo-600 text-zinc-800 dark:text-white transition-all duration-300 ease-in-out relative group cursor-pointer active:bg-indigo-600"
        >
          Start a Project
        </Link>

        <div
          aria-label="sidebar"
          onClick={onOpenSidebar}
          className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-full cursor-pointer"
        >
          <Sidebar className="size-6" />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
