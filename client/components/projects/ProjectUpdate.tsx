import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Project } from "@/types/project.types";
import {
  updateProjectSchema,
  type UpdateProjectSchema,
} from "@/schemas/project.schema";
import Input from "@/common/Input";
import Dropdown from "@/common/Dropdown";
import VariantButton from "@/common/VariantButton";
import Heading from "@/common/Heading";
import { Save } from "@/svg/More";

interface ProjectUpdateProps {
  project: Project;
  isUpdating: boolean;
  onSave: (data: UpdateProjectSchema) => Promise<void>;
  onBack: () => void;
}

export default function ProjectUpdate({
  project,
  isUpdating,
  onSave,
  onBack,
}: ProjectUpdateProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProjectSchema>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: project.title || "",
      description: project.description || "",
      priority: project.priority ?? 1,
      repository_url: project.repository_url || "",
    },
  });

  const selectedPriority = watch("priority");

  const onSubmit = (data: UpdateProjectSchema) => {
    onSave(data);
  };

  return (
    <div className="w-full fade-in pb-12">
      {/* Page Heading */}
      <Heading
        title="Project Settings"
        description={`Manage configurations and update the scope for: ${project.title}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col">
        {/* --- SECTION 1: CORE DETAILS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 py-8 border-t border-zinc-200 dark:border-zinc-800">
          {/* Section Info (Left) */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Core Details
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed pr-4">
              Update the foundational parameters of your project, including its
              title and repository links.
            </p>
          </div>

          {/* Form Inputs (Right) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Input
              label="Project Title"
              name="title"
              placeholder="e.g., Build Cryptographic Key Vault UI"
              register={register}
              error={errors.title?.message}
              rounded="rounded-2xl"
              disabled={isUpdating}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  disabled={isUpdating}
                />
              </div>

              <div className="flex flex-col">
                <Input
                  label="Git Repository URL (Optional)"
                  name="repository_url"
                  placeholder="e.g., https://github.com/org/repo"
                  register={register}
                  error={errors.repository_url?.message}
                  rounded="rounded-2xl"
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: SCOPE & REQUIREMENTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 py-8 border-t border-zinc-200 dark:border-zinc-800">
          {/* Section Info (Left) */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Scope & Requirements
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed pr-4">
              Refine the milestones, requirements, and deliverables to keep your
              team aligned.
            </p>
          </div>

          {/* Form Inputs (Right) */}
          <div className="lg:col-span-2 flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
            >
              Project Description
            </label>
            <textarea
              id="description"
              placeholder="Outline the project scope, key milestones, requirements, and deliverables in detail..."
              {...register("description")}
              rows={6}
              disabled={isUpdating}
              className={`
                w-full px-4 py-3.5 text-sm font-medium border-2 outline-none transition-all duration-200 focus:ring-4 rounded-xl resize-none
                ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/20"
                }
                text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-white dark:bg-zinc-900/40
                disabled:cursor-not-allowed disabled:opacity-60
              `}
            />
            {errors.description && (
              <span className="text-[13px] text-red-500 mt-0.5 ml-1 font-medium">
                {errors.description.message}
              </span>
            )}
          </div>
        </div>

        {/* --- INLINE ACTION BUTTONS --- */}
        <div className="flex flex-col sm:flex-row items-center justify-start gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full mt-2">
          <div className="w-full md:w-fit">
            <VariantButton
              label="Cancel"
              variant="default"
              type="button"
              onClick={onBack}
              disabled={isUpdating}
            />
          </div>
          <div className="w-full md:w-fit">
            <VariantButton
              label="Save Changes"
              variant="save"
              type="submit"
              icon={Save}
              isLoading={isUpdating}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
