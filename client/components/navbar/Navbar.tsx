import Link from "next/link";
import { Sidebar } from "@/svg/Common";
import { motion } from "framer-motion";
import { NAV_LINKS } from "@/utils/constants";
import { WavyText } from "../footer/Footer";
import Logo from "../logo/Logo";

const MotionLink = motion.create(Link);

interface NavbarProps {
  onOpenSidebar: () => void;
}

function Navbar({ onOpenSidebar }: NavbarProps) {
  return (
    <div className="w-fit flex items-center justify-center md:gap-x-3 gap-x-5 py-2 h-12 border border-zinc-100 dark:border-zinc-900 rounded-full pl-4 pr-1 backdrop-blur-lg bg-zinc-50/50 dark:bg-zinc-950/50">
      <Logo />

      <nav
        aria-label="Navigation"
        className="hidden md:flex items-center gap-1 relative px-2"
      >
        {NAV_LINKS.map((link) => (
          <MotionLink
            key={link.name}
            href={link.href}
            initial="initial"
            whileHover="hover"
            className="relative px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full"
          >
            <WavyText name={link.name} />
          </MotionLink>
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
          className="text-sm font-semibold px-4 py-2 rounded-full border-2 border-indigo-900 text-white relative group cursor-pointer bg-indigo-600"
        >
          Start a Project
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
