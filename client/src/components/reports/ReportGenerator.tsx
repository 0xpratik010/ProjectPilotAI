import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, CalendarIcon, Send, FileText, Loader2, Mail } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";

interface ReportRecipient {
  email: string;
  name: string;
  role: string;
}

const reportTypes = [
  { id: "weekly", name: "Weekly Status Report", description: "Comprehensive weekly status update including progress, issues, and upcoming milestones." },
  { id: "milestone", name: "Milestone Report", description: "Detailed report on milestone completion status and timeline adherence." },
  { id: "status", name: "Project Status Report", description: "Current project status, risks, and key metrics." },
];

const ReportGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [additionalEmails, setAdditionalEmails] = useState<string>("");
  const [includeDefaultRecipients, setIncludeDefaultRecipients] = useState(true);
  const [reportType, setReportType] = useState<"weekly" | "milestone" | "status">("weekly");
  
  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Get current project details
  const selectedProjectDetails = projects.find(p => p.id === selectedProject);
  
  // Default recipients based on project roles
  const getDefaultRecipients = (): ReportRecipient[] => {
    if (!selectedProjectDetails) return [];
    
    const recipients: ReportRecipient[] = [];
    
    if (selectedProjectDetails.pmName) {
      recipients.push({
        name: selectedProjectDetails.pmName,
        email: `${selectedProjectDetails.pmName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        role: "Project Manager"
      });
    }
    
    if (selectedProjectDetails.dlName) {
      recipients.push({
        name: selectedProjectDetails.dlName,
        email: `${selectedProjectDetails.dlName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        role: "Delivery Lead"
      });
    }
    
    if (selectedProjectDetails.tlName) {
      recipients.push({
        name: selectedProjectDetails.tlName,
        email: `${selectedProjectDetails.tlName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        role: "Technical Lead"
      });
    }
    
    return recipients;
  };
  
  // Parse additional emails
  const parseAdditionalEmails = (): ReportRecipient[] => {
    if (!additionalEmails.trim()) return [];
    
    return additionalEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))
      .map(email => ({
        email,
        name: email.split('@')[0],
        role: "Additional Recipient"
      }));
  };
  
  // Get all recipients
  const getAllRecipients = (): ReportRecipient[] => {
    const defaultRecipients = includeDefaultRecipients ? getDefaultRecipients() : [];
    const additionalRecipientsList = parseAdditionalEmails();
    
    return [...defaultRecipients, ...additionalRecipientsList];
  };
  
  // Generate and send report
  const { mutate: generateReport, isPending } = useMutation({
    mutationKey: ['generate-report'],
    mutationFn: async () => {
      if (!selectedProject || !selectedDate || !reportType) {
        throw new Error("Project, date, and report type are required");
      }
      
      const recipients = getAllRecipients();
      
      if (recipients.length === 0) {
        throw new Error("At least one recipient is required");
      }
      
      const response = await apiRequest("POST", "/api/reports/generate", {
        projectId: selectedProject,
        reportDate: selectedDate.toISOString(),
        reportType,
        recipients: recipients.map(r => r.email),
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report generated successfully",
        description: "The report has been generated and sent to the specified recipients.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating report",
        description: error.message || "There was an error generating the report.",
        variant: "destructive"
      });
    }
  });
  
  const handleGenerateReport = () => {
    generateReport();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Project Selection */}
            <div>
              <Label>Project</Label>
              <Select
                value={selectedProject?.toString()}
                onValueChange={(value) => setSelectedProject(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type */}
            <div>
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reportType && (
                <p className="mt-1 text-sm text-gray-500">
                  {reportTypes.find(t => t.id === reportType)?.description}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <Label>Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="default-recipients"
                  checked={includeDefaultRecipients}
                  onCheckedChange={(checked) => setIncludeDefaultRecipients(checked as boolean)}
                />
                <label
                  htmlFor="default-recipients"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include default project team
                </label>
              </div>

              <Input
                placeholder="Additional email addresses (comma-separated)"
                value={additionalEmails}
                onChange={(e) => setAdditionalEmails(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={() => generateReport()}
              disabled={!selectedProject || !selectedDate || !reportType || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate & Send Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recipients Preview */}
      {selectedProject && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recipients</h3>
            <div className="space-y-4">
              {getAllRecipients().length > 0 ? (
                getAllRecipients().map((recipient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-gray-500">{recipient.email}</p>
                    </div>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                      {recipient.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recipients selected</p>
                  <p className="text-sm">Select the project team or add email addresses above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportGenerator;