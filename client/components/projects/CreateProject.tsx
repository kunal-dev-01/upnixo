import { useState } from "react";
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
import ConfirmModal from "@/common/ConfirmModal";
import { Wallet, Bolt, Projects } from "@/svg/More";
import { AlertCircle } from "@/svg/Extra";
import { formatCurrency } from "@/utils/formats";
import Heading from "@/common/Heading";

interface CreateProjectProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateProject({
  onBack,
  onSuccess,
}: CreateProjectProps) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectSchema | null>(null);

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

  // Triggers review modal on successful validation
  const onSubmit = (data: CreateProjectSchema) => {
    setFormData(data);
    setIsReviewOpen(true);
  };

  // Submits validated project data to backend
  const handleConfirmLaunch = async () => {
    if (!formData) return;
    try {
      await createProjectAsync({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        currency: formData.currency,
        priority: formData.priority,
        deadline_at: formData.deadline_at
          ? new Date(formData.deadline_at).toISOString()
          : undefined,
      });
      toast.success("Project launched successfully!");
      setIsReviewOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create project workspace");
    }
  };

  return (
    <div className="w-full mx-auto fade-in">
      {/* Back navigation & page title */}
      <Heading
        title="Launch New Project"
        description="Define project scope, budget, and priority levels for your workspace."
      />

      {/* Main Creation Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full p-6 sm:p-8 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-900 rounded-3xl flex flex-col gap-6 mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project Title */}
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

          {/* Project Budget */}
          <div>
            <Input
              label="Budget amount"
              name="budget"
              type="number"
              placeholder="e.g., 2500"
              register={register}
              error={errors.budget?.message}
              rounded="rounded-2xl"
            />
          </div>

          {/* Currency Dropdown Selection */}
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

          {/* Priority Level Selection */}
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

          {/* Target Deadline Date Picker */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">
              Target Deadline (Optional)
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              {...register("deadline_at")}
              className={`w-full px-5 py-2.5 font-semibold border-2 outline-none transition-all duration-300 rounded-2xl bg-transparent ${
                errors.deadline_at
                  ? "border-red-500 focus:ring-red-500/10 focus:border-red-500 text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-400/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              }`}
            />
            {errors.deadline_at && (
              <span className="text-[13px] text-red-500 mt-0.5 ml-1 font-medium">
                {errors.deadline_at.message}
              </span>
            )}
          </div>

          {/* Project Description Scope */}
          <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
            >
              Project Scope & Description
            </label>
            <textarea
              id="description"
              placeholder="Outline the project scope, key milestones, requirements, and deliverables in details..."
              {...register("description")}
              rows={4}
              className={`
                w-full px-5 py-3.5 text-sm font-semibold border-2 outline-none transition-all duration-300 focus:ring-4 rounded-2xl resize-none
                ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-indigo-600/10 dark:focus:ring-indigo-400/20"
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

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div className="order-2 sm:order-1">
            <VariantButton
              label="Back to projects"
              variant="default"
              type="button"
              onClick={onBack}
            />
          </div>
          <div className="order-1 sm:order-2">
            <VariantButton
              label="Launch Workspace"
              variant="save"
              type="submit"
              icon={Projects}
              isLoading={isPending}
            />
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmLaunch}
        title="Confirm Project Launch"
        confirmLabel="Launch now"
        cancelLabel="Back to edit"
        variant="default"
        isPending={isPending}
      >
        {formData && (
          <>
            {/* Structured project detail specifications */}
            <div className="flex flex-col gap-4 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 mb-6 bg-zinc-50/50 dark:bg-zinc-900/10 text-sm text-left">
              {/* Title Preview */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                  Title
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {formData.title}
                </span>
              </div>

              {/* Budget & Priority Split row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">
                      Budget
                    </span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(formData.budget, formData.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                    <Bolt className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">
                      Priority
                    </span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                      {formData.priority === 2
                        ? "High"
                        : formData.priority === 1
                          ? "Medium"
                          : "Low"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description scope preview */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                  Scope Preview
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                  {formData.description}
                </p>
              </div>
            </div>

            {/* Submitting warnings */}
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/30 rounded-2xl text-[11px] font-semibold leading-relaxed mb-6 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Confirming this setup will register the project workspace and
                prepare the escrow contract securely.
              </span>
            </div>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}
