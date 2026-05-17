"use client";

import { useState } from "react";
import Heading from "@/common/Heading";
import ProjectList from "@/components/projects/ProjectList";
import CreateProject from "@/components/projects/CreateProject";
import ProjectCreationSuccess from "@/components/projects/ProjectCreationSuccess";

function Projects() {
  const [view, setView] = useState<"list" | "create" | "success">("list");

  return (
    <div className="w-full">
      {view === "list" && (
        <>
          <Heading
            title="Project Workspace"
            description="Organize, manage, and track all your projects in one place."
          />

          <div className="w-full mt-6">
            <ProjectList onCreateClick={() => setView("create")} />
          </div>
        </>
      )}

      {view === "create" && (
        <CreateProject
          onBack={() => setView("list")}
          onSuccess={() => setView("success")}
        />
      )}

      {view === "success" && (
        <ProjectCreationSuccess onComplete={() => setView("list")} />
      )}
    </div>
  );
}

export default Projects;
