"use client";
import Heading from "@/common/Heading";

function Account() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Heading
        title="Account & Settings"
        description="Manage your preferences, personal details, and platform experience."
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 lg:gap-6">
        {/* ROW 1: Identity (Mobile Order 1) */}
        <div className="md:col-span-2 order-1 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Identity
          </p>
          <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Avatar & Quick Info
          </div>
        </div>

        {/* ROW 1 (Desktop) / Mobile Order 3: Notifications */}
        <div className="md:col-span-4 order-3 md:order-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Notifications
          </p>
          <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Email & Push Toggles
          </div>
        </div>

        {/* ROW 2: Preferences (Desktop main pehle hnn or Bada hnn - 4/6) */}
        {/* Mobile order 4 hnn taaki niche aaye */}
        <div className="md:col-span-4 order-4 md:order-3 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Preferences
          </p>
          <div className="h-56 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Theme, Language, Currency (Desktop: Large View)
          </div>
        </div>

        {/* ROW 2: Personal Information (Desktop main baad main hnn or Chhota hnn - 2/6) */}
        {/* Mobile order 2 hnn taaki Identity ke turant niche aaye */}
        <div className="md:col-span-2 order-2 md:order-4 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Personal Details
          </p>
          <div className="h-56 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Name, Email, Phone
          </div>
        </div>

        {/* ROW 3: Security & Sessions (Equal Split) */}
        <div className="md:col-span-3 order-5 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Security & Auth
          </p>
          <div className="h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Password & 2FA
          </div>
        </div>

        <div className="md:col-span-3 order-6 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Active Sessions
          </p>
          <div className="h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
            Devices
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
