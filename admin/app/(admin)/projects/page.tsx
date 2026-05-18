"use client";

import Heading from "@/common/Heading";
import ProjectList from "@/components/projects/ProjectList";

function Projects() {
  return (
    <div className="w-full space-y-6 relative fade-in">
      <Heading
        title="Project Workspace"
        description="Manage project, tasks, milestones, deadlines, and team collaboration"
      />

      <ProjectList />
    </div>
  );
}

export default Projects;
