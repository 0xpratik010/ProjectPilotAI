import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Users, Clock } from "lucide-react";
import { format } from "date-fns";

interface ProjectListProps {
  onSelect: (projectId: number) => void;
  onNewProject: () => void;
}

const ProjectList = ({ onSelect, onNewProject }: ProjectListProps) => {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>;
      case "At Risk":
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">At Risk</span>;
      case "In Progress":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">In Progress</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Not Started</span>;
    }
  };
  
  const getProgressColor = (status: string, progress: number) => {
    if (status === "At Risk") return "bg-amber-500";
    if (progress > 80) return "bg-green-500";
    return "bg-primary-500";
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Active Projects</h2>
        <a 
          href="/projects"
          className="text-primary-500 hover:text-primary-600 text-sm font-medium"
        >
          View All
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card
            key={project.id}
            className="overflow-hidden border border-gray-200 hover:shadow-md transition cursor-pointer"
            onClick={() => onSelect(project.id)}
          >
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-gray-500 text-sm mt-2">{project.description}</p>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${getProgressColor(project.status, project.progress || 0)} h-2 rounded-full`} 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex -space-x-2">
                    {/* This would show team avatar pics */}
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border border-white text-xs">PM</div>
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-white text-xs">BA</div>
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-white text-xs">DL</div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {project.endDate ? `Due ${format(new Date(project.endDate), 'MMM d')}` : 'No end date'}
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center text-gray-600">
                    <Flag size={12} className="mr-1" /> Current: UAT Phase
                  </span>
                  <span className="flex items-center text-red-600">
                    <AlertCircle size={12} className="mr-1" /> 3 blockers
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Custom Flag component since we're not importing all Lucide icons
const Flag = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
);

export default ProjectList;
