import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProjectList from "@/components/dashboard/ProjectList";
import ProjectForm from "@/components/projects/ProjectForm";
import ProjectDetails from "@/components/projects/ProjectDetails";
import { Project } from "@shared/schema";

const ProjectsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(window.location.search.includes('action=create'));
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowCreateForm(false);
  };
  
  const handleNewProject = () => {
    setSelectedProjectId(null);
    setShowCreateForm(true);
  };
  
  const handleProjectCreated = () => {
    setShowCreateForm(false);
  };
  
  const handleBackToList = () => {
    setSelectedProjectId(null);
    setShowCreateForm(false);
  };
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      
      {selectedProjectId ? (
        <ProjectDetails 
          projectId={selectedProjectId} 
          onBack={handleBackToList} 
        />
      ) : showCreateForm ? (
        <ProjectForm 
          onCancel={handleBackToList}
          onCreate={handleProjectCreated}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Projects</h2>
            <button 
              onClick={handleNewProject}
              className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium"
            >
              Create New Project
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div 
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => handleSelectProject(project.id)}
              >
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${
                          project.status === "At Risk" 
                            ? "bg-amber-500" 
                            : project.progress && project.progress > 80 
                              ? "bg-green-500" 
                              : "bg-primary-500"
                        } h-2 rounded-full`} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : project.status === "At Risk"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {project.endDate 
                        ? `Due ${new Date(project.endDate).toLocaleDateString()}`
                        : 'No end date'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {projects.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-600">No projects found</h3>
              <p className="text-gray-500 mt-2">Create your first project to get started</p>
              <button 
                onClick={handleNewProject}
                className="mt-4 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Create New Project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;