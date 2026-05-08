"use client";
import Heading from "@/common/Heading";
import SubHeading from "@/common/SubHeading";
import Notifications from "@/components/account/Notifications";
import Preferences from "@/components/account/Preferences";
import Security from "@/components/account/Security";
import Sessions from "@/components/account/Sessions";
import UserDetails from "@/components/account/UserDetails";
import UserProfile from "@/components/account/UserProfile";
import { Theme } from "@/svg/Auth";
import { Bell, Shield, User } from "@/svg/Common";
import { Lock, FingerPrint } from "@/svg/More";

function Account() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Heading
        title="Account & Settings"
        description="Manage your preferences, personal details, and platform experience."
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 lg:gap-6">
        <div className="md:col-span-2 order-1 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Profile"
            description="View and edit your profile"
            icon={User}
            iconBgColor="bg-indigo-50 dark:bg-indigo-500/10"
            iconClassName="text-indigo-600 dark:text-indigo-400"
          />
          <UserProfile />
        </div>

        <div className="md:col-span-4 order-3 md:order-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Notifications"
            description="Manage your notification preferences"
            icon={Bell}
            iconBgColor="bg-amber-50 dark:bg-amber-500/10"
            iconClassName="text-amber-600 dark:text-amber-400"
          />
          <Notifications />
        </div>

        <div className="md:col-span-4 order-4 md:order-3 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Preferences"
            description="Manage your themes and platform experience"
            icon={Theme}
            iconBgColor="bg-purple-50 dark:bg-purple-500/10"
            iconClassName="text-purple-600 dark:text-purple-400"
          />
          <Preferences />
        </div>

        <div className="md:col-span-2 order-2 md:order-4 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Personal Details"
            description="Manage your personal information and contact details"
            icon={FingerPrint}
            iconBgColor="bg-sky-50 dark:bg-sky-500/10"
            iconClassName="text-sky-600 dark:text-sky-400"
          />
          <UserDetails />
        </div>

        <div className="md:col-span-2 order-5 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Security & Auth"
            description="Manage your password and two-factor authentication"
            icon={Lock}
            iconBgColor="bg-rose-50 dark:bg-rose-500/10"
            iconClassName="text-rose-600 dark:text-rose-400"
          />
          <Security />
        </div>

        <div className="md:col-span-4 order-6 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <SubHeading
            title="Active Sessions"
            description="Manage and track your logged-in devices"
            icon={Shield}
            iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
            iconClassName="text-emerald-600 dark:text-emerald-400"
          />
          <Sessions />
        </div>
      </div>
    </div>
  );
}

export default Account;
