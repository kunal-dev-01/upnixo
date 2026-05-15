import BackButton from "@/common/BackButton";
import { Mail } from "@/svg/Common";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  email: string;
  type: "password" | "master-key";
}

export default function ForgotSuccess({ email, type }: Props) {
  const isMasterKey = type === "master-key";
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8 py-4"
    >
      <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-6">
        <Mail className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Link Sent Successfully
        </h1>
        <div className="space-y-1">
          <p className="text-zinc-400">
            We've sent a recovery link for your{" "}
            {isMasterKey ? "Master Key" : "Password"} to:
          </p>
          <p className="font-semibold text-indigo-400">{email}</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-500 leading-relaxed">
        Please check your inbox (and spam folder) and follow the instructions to
        reset your {isMasterKey ? "Master Key" : "Password"}. The link will
        expire in{" "}
        <span className="text-zinc-300 font-medium">
          {isMasterKey ? "3 minutes" : "5 minutes"}
        </span>
        .
      </div>

      <div className="pt-4 flex flex-col items-center gap-4">
        <BackButton
          type="button"
          label="Return to Login"
          onClick={() => router.push("/auth/login")}
          className="w-full flex items-center justify-center"
        />

        <button
          onClick={() => window.location.reload()}
          className="text-sm text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          Try a different email?
        </button>
      </div>
    </motion.div>
  );
}
