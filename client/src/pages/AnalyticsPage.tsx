import { BarChart3, LineChart, PieChart, TrendingUp, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Project as BaseProject } from "@shared/schema";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

interface ProjectWithDates extends Omit<BaseProject, 'timelineConfig'> {
  plannedDuration?: number;
  actualDuration?: number;
  milestones?: Array<{ status: string }>;
  timelineConfig?: {
    milestones: Record<string, any>;
  };
}


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
        {/* Project Progress Bar Chart */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Project Progress</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={projects.map((project: any) => ({
                    name: project.name,
                    progress: project.progress || 0
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" name="Progress (%)" fill="#4f46e5" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Timeline Trends Line Chart */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Timeline Trends</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={projects.map((project: any) => {
                    let plannedProgress = 0;
                    if (project.startDate && project.endDate) {
                      plannedProgress = (new Date().getTime() - new Date(project.startDate).getTime()) /
                        (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) * 100;
                      plannedProgress = Math.min(Math.max(plannedProgress, 0), 100);
                    }
                    return {
                      name: project.name,
                      actual: project.progress || 0,
                      planned: plannedProgress
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Actual Progress" stroke="#4f46e5" />
                  <Line type="monotone" dataKey="planned" name="Planned Progress" stroke="#10b981" strokeDasharray="5 5" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Status Distribution and Milestone Completion Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Status Pie Chart */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Project Status Distribution</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(projects.reduce((acc: any, project: any) => {
                      acc[project.status] = (acc[project.status] || 0) + 1;
                      return acc;
                    }, {})).map(([status, count]) => ({ name: status, value: count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      '#4f46e5',
                      '#10b981',
                      '#f59e0b',
                      '#ef4444',
                      '#8b5cf6'
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Milestone Completion Bar Chart */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Milestone Completion</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={projects.map((project: any) => {
                    const milestones = project.timelineConfig?.milestones || {};
                    const totalMilestones = Object.keys(milestones).length;
                    const completedMilestones = project.progress ? Math.floor((project.progress / 100) * totalMilestones) : 0;
                    return {
                      name: project.name,
                      completed: completedMilestones,
                      remaining: totalMilestones - completedMilestones
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed Milestones" stackId="a" fill="#4f46e5" />
                  <Bar dataKey="remaining" name="Remaining Milestones" stackId="a" fill="#e5e7eb" />
                </RechartsBarChart>
              </ResponsiveContainer>
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