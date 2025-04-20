import { ProjectAssistant } from "./ProjectAssistant";
import { Timeline } from "./Timeline";
import { IssuesList } from "./IssuesList";
import { UpdatesList } from "./UpdatesList";

interface ProjectDashboardProps {
  projectId: number;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* Main Content - Timeline */}
      <div className="md:col-span-2 space-y-6">
        <Timeline projectId={projectId} />
        <IssuesList projectId={projectId} />
        <UpdatesList projectId={projectId} />
      </div>

      {/* Sidebar - Project Assistant */}
      <div className="space-y-6">
        <ProjectAssistant projectId={projectId} />
      </div>
    </div>
  );
}
