"use client";
import Heading from "@/common/Heading";

function Account() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Heading
        title="Account & Settings"
        description="Manage your preferences, personal details, and platform experience."
      />

      {/* Grid with Order Logic */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 lg:gap-6">
        {/* ROW 1: Identity (Desktop: 2/6 | Mobile: Order 1) */}
        <div className="md:col-span-2 order-1 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Identity
          </p>
          <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Avatar & Quick Info
          </div>
        </div>

        {/* ROW 1 (Desktop) / Mobile Order 3: Notifications (4/6) */}
        <div className="md:col-span-4 order-3 md:order-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Notifications
          </p>
          <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Email & Push Toggles
          </div>
        </div>

        {/* ROW 2 (Desktop) / Mobile Order 2: Personal Information (3/6) */}
        {/* Iska order-2 mobile pe isse Identity ke turant niche le aayega */}
        <div className="md:col-span-3 order-2 md:order-3 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Personal Details
          </p>
          <div className="h-56 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Form: Name, Email, Phone
          </div>
        </div>

        {/* ROW 2 (Desktop) / Mobile Order 4: Preferences (3/6) */}
        <div className="md:col-span-3 order-4 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Preferences
          </p>
          <div className="h-56 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Theme, Language, Currency
          </div>
        </div>

        {/* ROW 3: Security (Full Width / Mobile Order 5) */}
        <div className="md:col-span-6 order-5 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Security & Authentication
          </p>
          <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Two-Factor Auth & Password Management
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
