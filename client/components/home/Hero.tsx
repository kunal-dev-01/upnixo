import { motion } from "framer-motion";

function Hero() {
  // Animation settings
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  } as const;

  return (
    <div className="w-full max-w-6xl px-6 lg:px-0 mx-auto flex flex-col items-center justify-center text-center gap-y-6 lg:gap-y-10 select-none">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        className="w-full max-w-5xl relative leading-[1.1]"
      >
        <motion.span
          variants={fadeUp}
          className="block lg:text-7xl md:text-5xl text-4xl font-black text-white"
        >
          Building High <span className="text-indigo-500">Performance</span>
        </motion.span>

        <motion.span
          variants={fadeUp}
          className="block lg:text-7xl md:text-5xl text-4xl font-black text-white"
        >
          Systems at Scale.
        </motion.span>
      </motion.div>
    </div>
  );
}

export default Hero;
