"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useProjectBySlug } from "@/hooks/useProject";
import Heading from "@/common/Heading";
import { STATUS_CONFIG } from "@/utils/constants";
import { formatCurrency, formatDate } from "@/utils/formats";
import { Bolt, Wallet, Github } from "@/svg/More";
import { Check, TriangleAlert } from "@/svg/Common";

export default function ProjectDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  // Fetching data using your custom hook
  const { project, isPending, isError } = useProjectBySlug(slug || "");

  // Loading State - Clean & Minimal
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium text-sm">
          Loading project details...
        </p>
      </div>
    );
  }

  // Error or Not Found State
  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <TriangleAlert className="w-10 h-10 text-red-500" />
        <p className="text-zinc-500 font-medium text-sm">
          Project not found or an error occurred.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-6 mb-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 w-fit transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </button>

        <Heading
          title={project.title}
          description="View all details, timelines, and financial status for this project."
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Repositories (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description Block */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-4xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
              Project Description
            </h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </div>

          {/* Repository Block (If exists) */}
          {project.repository_url && (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-4xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Github className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Project Repository
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Access the source code and version control
                  </p>
                </div>
              </div>
              <a
                href={project.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white transition-colors"
              >
                Open Link
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Status & Meta Data */}
        <div className="flex flex-col gap-6">
          {/* Highlighted Status Card */}
          <div
            className={`p-6 border rounded-4xl bg-white dark:bg-zinc-950 ${config.border}`}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
              Current Status
            </h2>
            <div className="flex items-center gap-3">
              {/* Pulsing Dot Indicator */}
              <div className="relative flex h-3.5 w-3.5">
                {project.status !== "completed" &&
                  project.status !== "cancelled" && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${config.bg}`}
                    ></span>
                  )}
                <span
                  className={`relative inline-flex rounded-full h-3.5 w-3.5 ${config.bg}`}
                ></span>
              </div>
              <span
                className={`text-xl font-bold tracking-tight ${config.text} capitalize`}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* Details & Meta Card */}
          <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-4xl flex flex-col gap-6">
            {/* Priority */}
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <Bolt className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Priority
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Level {project.priority}
                </p>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800/80" />

            {/* Budget */}
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Total Budget
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                  {formatCurrency(project.budget, project.currency)}
                </p>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800/80" />

            {/* Escrow Status */}
            <div className="flex items-center gap-4">
              <div
                className={`p-2.5 rounded-xl border ${
                  project.is_escrow_funded
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}
              >
                {project.is_escrow_funded ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <TriangleAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Escrow Protection
                </p>
                <p
                  className={`text-sm font-semibold ${
                    project.is_escrow_funded
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {project.is_escrow_funded ? "Fully Funded" : "Awaiting Funds"}
                </p>
              </div>
            </div>
          </div>

          {/* Timelines Card */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-4xl flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Timelines
            </h2>

            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Created On</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                {formatDate(project.created_at)}
              </span>
            </div>

            {project.deadline_at && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Deadline</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {formatDate(project.deadline_at)}
                </span>
              </div>
            )}

            {project.completed_at && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Completed On</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatDate(project.completed_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
