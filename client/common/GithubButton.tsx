import { Github } from "@/svg/More";

function GithubButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full group relative overflow-hidden">
      <div className="absolute inset-0 rounded-full scale-x-90 opacity-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-in-out dark:bg-zinc-900 bg-zinc-100 pointer-events-none" />

      <button
        onClick={onClick}
        type="button"
        className="relative z-10 flex items-center justify-center gap-3 w-full px-3 py-2 border border-zinc-100 dark:border-zinc-900 rounded-full cursor-pointer overflow-hidden"
      >
        <Github className="w-5 h-5" />
        <span className="font-semibold text-md">Continue with Google</span>
      </button>
    </div>
  );
}

export default GithubButton;
