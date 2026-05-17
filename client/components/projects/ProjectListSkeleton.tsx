import { motion } from "framer-motion";

export default function ProjectListSkeleton() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="w-full p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col gap-5 animate-pulse"
        >
          {/* Header Skeleton */}
          <div className="flex justify-between items-center w-full">
            <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
            <div className="h-6 w-14 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
          </div>

          {/* Content Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
            <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
          </div>

          {/* Info row Skeleton */}
          <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-100 dark:border-zinc-900">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-900" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-900" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex justify-between items-center pt-1">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-900 rounded-xl" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
