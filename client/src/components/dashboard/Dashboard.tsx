import { useState } from "react";
import Stats from "./Stats";
import NaturalLanguageUpdate from "./NaturalLanguageUpdate";
import AssistantChat from "./AssistantChat";
import ProjectList from "./ProjectList";
import MilestoneList from "./MilestoneList";
import ProjectDetails from "../projects/ProjectDetails";
import ProjectForm from "../projects/ProjectForm";

const Dashboard = () => {
  // Manage view state
  const [view, setView] = useState<"dashboard" | "project-details" | "project-form">("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Handle project selection
  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setView("project-details");
  };
  
  // Handle new project button
  const handleNewProject = () => {
    setView("project-form");
  };
  
  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedProjectId(null);
  };
  
  return (
    <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-y-auto">
      {view === "dashboard" && (
        <div className="space-y-6">
          <Stats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NaturalLanguageUpdate />
            <AssistantChat />
          </div>
          <ProjectList onSelect={handleProjectSelect} onNewProject={handleNewProject} />
          <MilestoneList />
        </div>
      )}
      
      {view === "project-details" && selectedProjectId && (
        <ProjectDetails 
          projectId={selectedProjectId} 
          onBack={handleBackToDashboard} 
        />
      )}
      
      {view === "project-form" && (
        <ProjectForm onCancel={handleBackToDashboard} onCreate={handleBackToDashboard} />
      )}
    </main>
  );
};

export default Dashboard;
