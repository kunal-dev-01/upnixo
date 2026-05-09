import { toast } from "sonner";
import { Copy, Download } from "@/svg/Common";

interface Props {
  codes: string[];
  variant?: "compact" | "full";
}

export default function BackupCodesGrid({ codes, variant = "compact" }: Props) {
  const isFull = variant === "full";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    toast.success("All codes copied to clipboard");
  };

  const downloadAsJSON = () => {
    const data = JSON.stringify({ backup_codes: codes }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_codes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-2 gap-2 ${isFull ? "p-6" : "p-4"} bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl`}
      >
        {codes.map((code, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${isFull ? "p-2.5" : "p-2"} bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm`}
          >
            <span className="text-[10px] text-zinc-400 font-mono">
              {(i + 1).toString().padStart(2, "0")}
            </span>
            <code
              className={`${isFull ? "text-xs" : "text-[10px]"} font-mono font-bold text-zinc-700 dark:text-zinc-200 tracking-wider`}
            >
              {code}
            </code>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          type="button"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" /> Copy All
        </button>
        <button
          onClick={downloadAsJSON}
          type="button"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" /> Download JSON
        </button>
      </div>
    </div>
  );
}
