import { motion } from "framer-motion";
import VariantButton from "@/common/VariantButton";
import { Projects } from "@/svg/More";

interface NoProjectsProps {
  onClick?: () => void;
}

export default function NoProjects({ onClick }: NoProjectsProps) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="w-full py-16 px-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center shadow-xs"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl transform scale-150 animate-pulse" />
        <div className="relative p-6 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full">
          <Projects className="w-10 h-10" />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
        No Projects Found
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
        Apke paas abhi koi design ya projects workspace nahi hain. Apne
        developer ke saath collaborative ecosystem shuru karne ke liye niche
        diye gaye button se pehla project create karein!
      </p>

      <div className="w-full max-w-xs">
        <VariantButton
          label="Create Project"
          variant="save"
          onClick={onClick}
        />
      </div>
    </motion.div>
  );
}
