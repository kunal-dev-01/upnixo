import { Mail } from "@/svg/Common";

function WithMail({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full group relative overflow-hidden">
      <div className="absolute inset-0 rounded-full scale-x-90 opacity-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-in-out dark:bg-indigo-600 bg-indigo-500 pointer-events-none" />

      <button
        onClick={onClick}
        type="button"
        className="relative z-10 flex items-center justify-center gap-3 w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 lg:dark:border-zinc-800/60 rounded-full cursor-pointer overflow-hidden"
      >
        <Mail className="w-5.5 h-5.5 group-hover:text-white transition-colors duration-300 ease-in-out" />
        <span className="font-semibold text-md group-hover:text-white transition-colors duration-300 ease-in-out">
          Continue with Email
        </span>
      </button>
    </div>
  );
}

export default WithMail;
