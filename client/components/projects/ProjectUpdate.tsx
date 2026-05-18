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
import { Edit } from "@/svg/Common";

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
    <div className="w-full mx-auto fade-in">
      {/* Title & Description of update page */}
      <Heading
        title="Update Project Settings"
        description={`Modify the configurations and scope for the project workspace: ${project.title}`}
      />

      {/* Main Settings Form */}
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
              disabled={isUpdating}
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
              disabled={isUpdating}
            />
          </div>

          {/* Repository URL */}
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
              rows={5}
              disabled={isUpdating}
              className={`
                w-full px-5 py-3.5 text-sm font-semibold border-2 outline-none transition-all duration-300 focus:ring-4 rounded-2xl resize-none
                ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-indigo-600/10 dark:focus:ring-indigo-400/20"
                }
                text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent
                disabled:cursor-not-allowed disabled:opacity-50
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full border-t border-zinc-100 dark:border-zinc-900 pt-6 mt-2">
          <div className="order-2 sm:order-1">
            <VariantButton
              label="Back to projects"
              variant="default"
              type="button"
              onClick={onBack}
              disabled={isUpdating}
            />
          </div>
          <div className="order-1 sm:order-2">
            <VariantButton
              label="Save Changes"
              variant="save"
              type="submit"
              icon={Edit}
              isLoading={isUpdating}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
