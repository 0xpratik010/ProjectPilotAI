import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import { Link } from "wouter";

interface ProjectListProps {
  onSelect: (projectId: number) => void;
  onNewProject: () => void;
}

const ProjectList = ({ onSelect, onNewProject }: ProjectListProps) => {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-gray-200">Active Projects</h2>
        <a 
          href="/projects"
          className="text-primary-500 dark:text-primary hover:text-primary-600 dark:hover:text-primary/80 text-sm font-medium"
        >
          View All
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card 
              className="p-4 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow cursor-pointer dark:bg-card dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10"
            >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold dark:text-gray-200">{project.name}</h3>
              <span className={`px-2 py-1 text-sm rounded-full ${
                project.status === "In Progress" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                project.status === "Completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
                {project.status}
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {project.description || "No description provided"}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium dark:text-gray-300">{project.progress}%</span>
              </div>
              
              <div className="relative w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 dark:bg-green-400 transition-all duration-300 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Current: {project.currentPhase}
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400">PM:</span>
                  <span className="ml-1 font-medium dark:text-gray-300">{project.pmName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Due {new Date(project.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
