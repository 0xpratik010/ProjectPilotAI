import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Project as BaseProject } from '@shared/schema';
import { FileBarChart, BarChart, PieChart, LineChart, Download, Calendar, FileText, Mail, BarChart3 } from "lucide-react";
import { format, subDays } from "date-fns";
import ReportGenerator from "@/components/reports/ReportGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ReportType = "progress" | "status" | "timeline" | "milestones";

interface ProjectWithDates extends Omit<BaseProject, 'timelineConfig'> {
  plannedDuration?: number;
  actualDuration?: number;
  milestones?: Array<{ status: string }>;
  timelineConfig?: {
    milestones: Record<string, any>;
  };
}

const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>("progress");
  const [activeTab, setActiveTab] = useState<"view" | "generate">("view");
  
  const { data: projects = [] } = useQuery<ProjectWithDates[]>({
    queryKey: ["/api/projects"],
  });
  
  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
  };

  const handleTabChange = (tab: "view" | "generate") => {
    setActiveTab(tab);
  };

  const data = {
    progress: {
      data: projects.map((project: ProjectWithDates) => ({
        name: project.name,
        progress: project.progress || 0,
      })),
    },
    status: {
      data: projects.reduce((acc, project: ProjectWithDates) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    timeline: {
      data: projects.map((project: ProjectWithDates) => ({
        name: project.name,
        planned: project.plannedDuration || 0,
        actual: project.actualDuration || 0,
      })),
    },
    milestones: {
      data: projects.map((project: ProjectWithDates) => {
        const milestones = project.timelineConfig?.milestones || {};
        const totalMilestones = Object.keys(milestones).length;
        const completedMilestones = project.progress ? Math.floor((project.progress / 100) * totalMilestones) : 0;
        return {
          name: project.name,
          completed: completedMilestones,
          remaining: totalMilestones - completedMilestones
        };
      }),
    },
  };

  const reportTypes = [
    { id: "progress", name: "Project Progress", icon: <BarChart size={18} className="mr-2" /> },
    { id: "status", name: "Project Status Distribution", icon: <PieChart size={18} className="mr-2" /> },
    { id: "timeline", name: "Timeline Adherence", icon: <LineChart size={18} className="mr-2" /> },
    { id: "milestones", name: "Milestone Completion", icon: <Calendar size={18} className="mr-2" /> },
  ];
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "view" | "generate")} className="w-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="view" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Generate & Send
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="view" className="mt-0">
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
                        onClick={() => handleReportTypeChange(type.id as ReportType)}
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
                  {/* Project Progress Chart */}
                  {reportType === "progress" && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBarChart
                        data={projects.map(project => ({
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
                  )}
                  {/* Project Status Distribution Chart */}
                  {reportType === "status" && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsPieChart>
                        <Pie
                          data={Object.entries(projects.reduce((acc, project) => {
                            acc[project.status] = (acc[project.status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)).map(([status, count]) => ({
                            name: status,
                            value: count
                          }))}
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
                  )}
                  {/* Timeline Adherence Chart */}
                  {reportType === "timeline" && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart
                        data={projects.map(project => {
                          const plannedProgress = (new Date().getTime() - new Date(project.startDate).getTime()) /
                            (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) * 100;
                          return {
                            name: project.name,
                            actual: project.progress || 0,
                            planned: Math.min(Math.max(plannedProgress, 0), 100)
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
                  )}
                  {/* Milestone Completion Chart */}
                  {reportType === "milestones" && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBarChart
                        data={data.milestones.data}
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
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="generate" className="mt-0">
          <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;