import { BarChart3, LineChart, PieChart, TrendingUp, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";

const AnalyticsPage = () => {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Calculate project statistics
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === "In Progress").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const atRiskProjects = projects.filter(p => p.status === "At Risk").length;
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-500">
                <PieChart size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold">{inProgressProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">At Risk</p>
                <p className="text-2xl font-bold">{atRiskProjects}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
                <Calendar size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{completedProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Project Progress</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <BarChart3 size={48} className="mb-3 text-gray-400" />
                <p>Project progress chart will be displayed here</p>
                <p className="text-sm">Showing progress data across all active projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Timeline Trends</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <LineChart size={48} className="mb-3 text-gray-400" />
                <p>Project timeline trends will be displayed here</p>
                <p className="text-sm">Showing how projects are tracking against deadlines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Performance */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Project Performance</h2>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Project Name</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Progress</th>
                  <th scope="col" className="px-6 py-3">Performance</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === "Completed" ? "bg-green-100 text-green-800" :
                        project.status === "At Risk" ? "bg-amber-100 text-amber-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${
                            project.status === "At Risk" ? "bg-amber-500" :
                            project.progress && project.progress > 80 ? "bg-green-500" : "bg-primary-500"
                          } h-2.5 rounded-full`} 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">{project.progress}%</span>
                    </td>
                    <td className="px-6 py-4">
                      {project.status === "At Risk" ? 
                        <span className="text-amber-500 flex items-center">Below Target</span> :
                        project.progress && project.progress > 80 ? 
                        <span className="text-green-500 flex items-center">On Target</span> :
                        <span className="text-blue-500 flex items-center">In Progress</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;