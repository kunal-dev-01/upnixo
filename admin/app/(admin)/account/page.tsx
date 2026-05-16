"use client";

import Heading from "@/common/Heading";
import SubHeading from "@/common/SubHeading";
import Session from "@/components/account/Session";
import UserProfile from "@/components/account/UserProfile";
import { User, Shield } from "@/svg/Common";

function Account() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <Heading
        title="Account Settings"
        description="Manage your profile information and active security sessions."
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile (Small Grid) */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 space-y-4">
            <SubHeading
              title="Profile"
              description="Your personal information"
              icon={User}
              iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
              iconClassName="text-indigo-600 dark:text-indigo-400"
            />

            <UserProfile />
          </div>
        </div>

        {/* Right Column: Sessions (Large Grid) */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 space-y-4">
            <SubHeading
              title="Active Sessions"
              description="Manage your currently logged-in devices"
              icon={Shield}
              iconBgColor="bg-green-50 dark:bg-green-500/10"
              iconClassName="text-green-600 dark:text-green-400"
            />

            <Session />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
