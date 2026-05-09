import { SimpleCheck } from "@/svg/Common";
import BackupCodesGrid from "./BackupCodesGrid";
import VariantButton from "@/common/VariantButton";

interface Props {
  codes: string[];
  onDone: () => void;
}

export default function BackupCodesDisplay({ codes, onDone }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
          <SimpleCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          New Backup Codes
        </h3>
        <p className="text-sm text-zinc-500">
          Save these codes in a safe place. You can use them to access your
          account if you lose your phone.
        </p>
      </div>

      <BackupCodesGrid codes={codes} variant="full" />

      <VariantButton label="Done" variant="save" onClick={onDone} />
    </div>
  );
}
