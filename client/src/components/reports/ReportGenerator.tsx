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
import { ChevronDown, CalendarIcon, Send, FileText, Loader2 } from "lucide-react";
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
    mutationFn: async () => {
      if (!selectedProject || !selectedDate) {
        throw new Error("Project and date are required");
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
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">Generate Project Report</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select 
              value={selectedProject?.toString() || ""} 
              onValueChange={(value) => setSelectedProject(parseInt(value))}
            >
              <SelectTrigger id="project" className="w-full">
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
          
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select 
              value={reportType} 
              onValueChange={(value: "weekly" | "milestone" | "status") => setReportType(value)}
            >
              <SelectTrigger id="reportType" className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Status Report</SelectItem>
                <SelectItem value="milestone">Milestone Report</SelectItem>
                <SelectItem value="status">Project Status Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportDate">Report Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="reportDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id="includeDefault" 
                checked={includeDefaultRecipients}
                onCheckedChange={(checked) => 
                  setIncludeDefaultRecipients(checked as boolean)
                }
              />
              <Label 
                htmlFor="includeDefault" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include default team recipients
              </Label>
            </div>
            
            {includeDefaultRecipients && selectedProjectDetails && (
              <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
                <h4 className="font-medium text-gray-700 mb-2">Default Recipients:</h4>
                <ul className="space-y-1 text-gray-600">
                  {getDefaultRecipients().map((recipient, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{recipient.name} ({recipient.role})</span>
                      <span className="text-gray-500">{recipient.email}</span>
                    </li>
                  ))}
                  {getDefaultRecipients().length === 0 && (
                    <li className="text-gray-500">No default recipients found for this project</li>
                  )}
                </ul>
              </div>
            )}
            
            <Label htmlFor="additionalEmails">Additional Recipients (comma-separated)</Label>
            <Input
              id="additionalEmails"
              placeholder="e.g., john.doe@example.com, jane.smith@example.com"
              value={additionalEmails}
              onChange={(e) => setAdditionalEmails(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter email addresses separated by commas
            </p>
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedProject || !selectedDate || isPending || getAllRecipients().length === 0}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate & Send Report
                </>
              )}
            </Button>
            <Button
              variant="outline"
              disabled={!selectedProject || !selectedDate || isPending}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              Preview Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;