import { useQuery } from "@tanstack/react-query";
import { Folder, Flag, AlertTriangle, CheckSquare, TrendingUp, TrendingDown } from "lucide-react";
import { Project } from "@shared/schema";

const Stats = () => {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Calculate statistics
  const activeProjects = projects.filter(p => p.status === "In Progress").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const atRiskProjects = projects.filter(p => 
    p.status === "In Progress" && p.progress && p.progress < 50
  ).length;
  
  // Count upcoming milestones
  const upcomingMilestones = 8; // This would be calculated based on milestone data
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Projects</p>
            <p className="text-2xl font-bold mt-1">{activeProjects}</p>
          </div>
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-500">
            <Folder size={24} />
          </div>
        </div>
        <div className="flex items-center mt-4 text-xs">
          <span className="text-green-500 flex items-center">
            <TrendingUp size={14} className="mr-1" /> 8%
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Upcoming Milestones</p>
            <p className="text-2xl font-bold mt-1">{upcomingMilestones}</p>
          </div>
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-500">
            <Flag size={24} />
          </div>
        </div>
        <div className="flex items-center mt-4 text-xs">
          <span className="text-red-500 flex items-center">
            <TrendingDown size={14} className="mr-1" /> 3%
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">At Risk</p>
            <p className="text-2xl font-bold mt-1">{atRiskProjects}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="flex items-center mt-4 text-xs">
          <span className="text-green-500 flex items-center">
            <TrendingDown size={14} className="mr-1" /> 12%
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold mt-1">{completedProjects}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
            <CheckSquare size={24} />
          </div>
        </div>
        <div className="flex items-center mt-4 text-xs">
          <span className="text-green-500 flex items-center">
            <TrendingUp size={14} className="mr-1" /> 24%
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
