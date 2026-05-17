"use client";
import Heading from "@/common/Heading";
import ProjectList from "@/components/projects/ProjectList";

function Projects() {
  return (
    <div className="w-full">
      <Heading
        title="Project Workspace"
        description="Organize, manage, and track all your projects in one place."
      />

      <div className="w-full mt-6">
        <ProjectList />
      </div>
    </div>
  );
}

export default Projects;
