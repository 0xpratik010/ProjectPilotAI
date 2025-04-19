import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { FileBarChart, BarChart, PieChart, LineChart, Download, Calendar, FileText, Mail, BarChart3 } from "lucide-react";
import { format, subDays } from "date-fns";
import ReportGenerator from "@/components/reports/ReportGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReportsPage = () => {
  const [reportType, setReportType] = useState<string>("progress");
  const [activeTab, setActiveTab] = useState<string>("view");
  
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
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
        </Tabs>
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
                
                {/* Report content goes here based on reportType */}
                <div className="h-80 flex items-center justify-center text-gray-500">
                  {reportType === "progress" && <BarChart size={48} />}
                  {reportType === "status" && <PieChart size={48} />}
                  {reportType === "timeline" && <LineChart size={48} />}
                  {reportType === "milestones" && <Calendar size={48} />}
                  <div className="ml-4">
                    <p>Report visualization will be displayed here</p>
                    <p className="text-sm">Data is being compiled from project sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="generate" className="mt-0">
        <ReportGenerator />
      </TabsContent>
    </div>
  );
};

export default ReportsPage;