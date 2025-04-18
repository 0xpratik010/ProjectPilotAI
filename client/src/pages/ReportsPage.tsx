import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { FileBarChart, BarChart, PieChart, LineChart, Download, Calendar, FileText } from "lucide-react";
import { format, subDays } from "date-fns";

const ReportsPage = () => {
  const [reportType, setReportType] = useState<string>("progress");
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const reportTypes = [
    { id: "progress", name: "Project Progress", icon: <BarChart size={18} className="mr-2" /> },
    { id: "status", name: "Project Status Distribution", icon: <PieChart size={18} className="mr-2" /> },
    { id: "timeline", name: "Timeline Adherence", icon: <LineChart size={18} className="mr-2" /> },
    { id: "milestones", name: "Milestone Completion", icon: <Calendar size={18} className="mr-2" /> },
  ];
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4 flex items-center">
                <FileText size={18} className="mr-2 text-primary-500" /> Report Types
              </h2>
              
              <div className="space-y-1">
                {reportTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`w-full flex items-center text-left px-3 py-2 rounded-md text-sm ${
                      reportType === type.id
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {type.icon}
                    {type.name}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h2 className="font-semibold mb-4">Export Options</h2>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                    <Download size={16} className="mr-2" /> Export as PDF
                  </button>
                  <button className="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                    <Download size={16} className="mr-2" /> Export as CSV
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {reportTypes.find(t => t.id === reportType)?.name || "Report"}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Generated on {format(new Date(), "MMMM d, yyyy")}</span>
                </div>
              </div>
              
              {reportType === "progress" && (
                <div className="space-y-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <BarChart size={48} className="mb-3 text-gray-400" />
                      <p>Project progress chart will be displayed here</p>
                      <p className="text-sm">Showing progress data across all active projects</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-2">Project Progress Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Project</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Progress</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Projected Finish</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {projects.map(project => (
                            <tr key={project.id}>
                              <td className="px-4 py-3">{project.name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  project.status === "Completed" ? "bg-green-100 text-green-800" :
                                  project.status === "At Risk" ? "bg-amber-100 text-amber-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {project.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`${
                                        project.status === "At Risk" ? "bg-amber-500" :
                                        project.progress && project.progress > 80 ? "bg-green-500" : "bg-primary-500"
                                      } h-2 rounded-full`} 
                                      style={{ width: `${project.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{project.progress}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "Not set"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {reportType === "status" && (
                <div className="space-y-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <PieChart size={48} className="mb-3 text-gray-400" />
                      <p>Project status distribution chart will be displayed here</p>
                      <p className="text-sm">Showing current status breakdown of all projects</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-medium text-green-800 mb-1">Completed</h4>
                      <p className="text-2xl font-bold text-green-700">{projects.filter(p => p.status === "Completed").length}</p>
                      <p className="text-sm text-green-600 mt-1">Projects successfully completed</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-1">In Progress</h4>
                      <p className="text-2xl font-bold text-blue-700">{projects.filter(p => p.status === "In Progress").length}</p>
                      <p className="text-sm text-blue-600 mt-1">Projects currently in execution</p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h4 className="font-medium text-amber-800 mb-1">At Risk</h4>
                      <p className="text-2xl font-bold text-amber-700">{projects.filter(p => p.status === "At Risk").length}</p>
                      <p className="text-sm text-amber-600 mt-1">Projects needing intervention</p>
                    </div>
                  </div>
                </div>
              )}
              
              {reportType === "timeline" && (
                <div className="space-y-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <LineChart size={48} className="mb-3 text-gray-400" />
                      <p>Timeline adherence chart will be displayed here</p>
                      <p className="text-sm">Showing how well projects are following their timelines</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-2">Timeline Analysis</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This report analyzes how well projects are adhering to their planned timelines, 
                      identifying delays and potential issues.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-2">On-Time Projects</h4>
                        <p className="text-3xl font-bold text-green-600">75%</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Projects that are currently on schedule or ahead of planned timeline
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-2">Average Delay</h4>
                        <p className="text-3xl font-bold text-amber-600">3.2 days</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Average delay across all projects that are behind schedule
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {reportType === "milestones" && (
                <div className="space-y-6">
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar size={48} className="mb-3 text-gray-400" />
                      <p>Milestone completion chart will be displayed here</p>
                      <p className="text-sm">Showing milestone completion rates across projects</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-2">Recent Milestone Activities</h3>
                    <div className="space-y-3">
                      <div className="flex items-start p-3 bg-green-50 border border-green-100 rounded-md">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                          <FileBarChart size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">BFRD Sign-off Completed</p>
                          <p className="text-sm text-green-700">CRM Migration Project</p>
                          <p className="text-xs text-green-600 mt-1">
                            {format(subDays(new Date(), 2), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                          <FileBarChart size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Configuration Started</p>
                          <p className="text-sm text-blue-700">ERP Implementation Project</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {format(subDays(new Date(), 4), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start p-3 bg-amber-50 border border-amber-100 rounded-md">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-3 flex-shrink-0">
                          <FileBarChart size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-amber-800">UAT Phase Delayed</p>
                          <p className="text-sm text-amber-700">Document Management System</p>
                          <p className="text-xs text-amber-600 mt-1">
                            {format(subDays(new Date(), 6), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;