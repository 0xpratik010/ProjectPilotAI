import { useRoute } from "wouter";
import ProjectDetails from "@/components/projects/ProjectDetails";
import { useLocation } from "wouter";

const ProjectPage = () => {
  const [, params] = useRoute<{ id: string }>("/projects/:id");
  const [, navigate] = useLocation();
  
  // Handle back navigation
  const handleBack = () => {
    navigate("/projects");
  };

  if (!params || !params.id) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-600">Project not found</h3>
          <p className="text-gray-500 mt-2">The requested project could not be found</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const projectId = parseInt(params.id, 10);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <ProjectDetails 
        projectId={projectId} 
        onBack={handleBack} 
      />
    </div>
  );
};

export default ProjectPage;
