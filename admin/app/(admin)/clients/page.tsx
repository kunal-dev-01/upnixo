"use client";

import Heading from "@/common/Heading";
import ClientList from "@/components/client/ClientList";

function Clients() {
  return (
    <div className="w-full space-y-6 relative fade-in">
      <Heading
        title="Client Workspace"
        description="Manage client accounts, projects, and activity"
      />

      <ClientList />
    </div>
  );
}

export default Clients;
