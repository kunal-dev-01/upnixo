import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/useProject";
import {
  createProjectSchema,
  type CreateProjectSchema,
} from "@/schemas/project.schema";
import Input from "@/common/Input";
import Dropdown from "@/common/Dropdown";
import VariantButton from "@/common/VariantButton";
import { Projects } from "@/svg/More";
import Heading from "@/common/Heading";

interface CreateProjectProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateProject({
  onBack,
  onSuccess,
}: CreateProjectProps) {
  const { createProjectAsync, isPending } = useCreateProject();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectSchema>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      currency: "USD",
      priority: 1,
      deadline_at: "",
    },
  });

  const selectedCurrency = watch("currency");
  const selectedPriority = watch("priority");

  // Direct submission to backend (Modal removed)
  const onSubmit = async (data: CreateProjectSchema) => {
    try {
      await createProjectAsync({
        title: data.title,
        description: data.description,
        budget: data.budget,
        currency: data.currency,
        priority: data.priority,
        deadline_at: data.deadline_at
          ? new Date(data.deadline_at).toISOString()
          : undefined,
      });
      toast.success("Project workspace launched successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create project workspace");
    }
  };

  return (
    <div className="w-full fade-in pb-10 relative">
      {/* Page Heading */}
      <Heading
        title="Launch New Project"
        description="Configure your workspace details, budget, and scope to get started."
      />

      {/* Timeline/Stepper Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative mt-10 ml-2 md:ml-4 max-w-4xl"
      >
        {/* Left connecting line */}
        <div className="absolute left-[11px] top-2 bottom-8 w-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full" />

        {/* --- STEP 1: PROJECT DETAILS --- */}
        <div className="relative pl-10 md:pl-12 pb-12">
          {/* Node Point */}
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-4 border-indigo-600 dark:border-indigo-500 z-10 shadow-sm" />

          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              1. Core Details
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Set the foundational parameters for your new project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Title (Full Width) */}
            <div className="md:col-span-2">
              <Input
                label="Project Title"
                name="title"
                placeholder="e.g., Build Cryptographic Key Vault UI"
                register={register}
                error={errors.title?.message}
                rounded="rounded-2xl"
              />
            </div>

            {/* Budget */}
            <div>
              <Input
                label="Budget Amount"
                name="budget"
                type="number"
                placeholder="e.g., 2500"
                register={register}
                error={errors.budget?.message}
                rounded="rounded-2xl"
              />
            </div>

            {/* Currency */}
            <div className="flex flex-col">
              <Dropdown
                label="Currency"
                options={[
                  { label: "USD ($)", value: "USD" },
                  { label: "INR (₹)", value: "INR" },
                  { label: "EUR (€)", value: "EUR" },
                  { label: "GBP (£)", value: "GBP" },
                ]}
                value={selectedCurrency}
                onChange={(val) =>
                  setValue("currency", val, { shouldValidate: true })
                }
              />
            </div>

            {/* Priority */}
            <div className="flex flex-col">
              <Dropdown
                label="Priority Level"
                options={[
                  { label: "Low Priority", value: "0" },
                  { label: "Medium Priority", value: "1" },
                  { label: "High Priority", value: "2" },
                ]}
                value={String(selectedPriority)}
                onChange={(val) =>
                  setValue("priority", Number(val), { shouldValidate: true })
                }
              />
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">
                Target Deadline (Optional)
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("deadline_at")}
                className={`w-full px-4 py-2.5 text-sm font-semibold border-2 outline-none transition-all duration-200 rounded-2xl bg-transparent ${
                  errors.deadline_at
                    ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                }`}
              />
              {errors.deadline_at && (
                <span className="text-[13px] text-red-500 mt-0.5 ml-1 font-medium">
                  {errors.deadline_at.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- STEP 2: PROJECT SCOPE --- */}
        <div className="relative pl-10 md:pl-12 pb-12">
          {/* Node Point */}
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-4 border-zinc-300 dark:border-zinc-700 z-10 shadow-sm" />

          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              2. Scope & Requirements
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Provide a detailed description of milestones and deliverables.
            </p>
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <textarea
              id="description"
              placeholder="Outline the project scope, key milestones, requirements, and deliverables in detail..."
              {...register("description")}
              rows={5}
              className={`
                w-full px-4 py-3.5 text-sm font-medium border-2 outline-none transition-all duration-200 focus:ring-4 rounded-2xl resize-none
                ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/20"
                }
                text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent
              `}
            />
            {errors.description && (
              <span className="text-[13px] text-red-500 mt-0.5 ml-1 font-medium">
                {errors.description.message}
              </span>
            )}
          </div>
        </div>

        {/* --- STEP 3: ACTIONS --- */}
        <div className="relative pl-10 md:pl-12">
          {/* Final Node Point */}
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-4 border-zinc-300 dark:border-zinc-700 z-10 shadow-sm" />

          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              3. Ready to Launch
            </h3>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center md:gap-4 gap-2">
            <div className="w-full lg:w-fit">
              <VariantButton
                label="Cancel"
                variant="default"
                type="button"
                onClick={onBack}
              />
            </div>
            <div className="w-full lg:w-fit">
              <VariantButton
                label="Launch Workspace"
                variant="save"
                type="submit"
                icon={Projects}
                isLoading={isPending}
              />
            </div>
          </div>
        </div>
      </form>

      <div className="absolute inset-0 -z-5 w-full h-full"></div>
    </div>
  );
}
