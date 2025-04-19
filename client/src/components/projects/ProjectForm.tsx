import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertProject } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFormProps {
  onCancel: () => void;
  onCreate: () => void;
}

const ProjectForm = ({ onCancel, onCreate }: ProjectFormProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<InsertProject>>({
    name: "",
    number: "",
    moduleName: "",
    description: "",
    pmName: "",
    dlName: "",
    baName: "",
    tlName: "",
    uiLeadName: "",
    dbLeadName: "",
    qaLeadName: "",
    startDate: null,
    endDate: null,
  });
  
  const [activeSection, setActiveSection] = useState("basic");
  const [durationInWeeks, setDurationInWeeks] = useState<number>(12);
  
  useEffect(() => {
    if (formData.startDate) {
      const calculatedEndDate = addWeeks(new Date(formData.startDate), durationInWeeks);
      setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
    }
  }, [formData.startDate, durationInWeeks]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDurationChange = (value: string) => {
    setDurationInWeeks(parseInt(value));
  };
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        ...formData,
        status: "Not Started",
        progress: 0
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
      onCreate();
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message || "There was an error creating your project.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create New Project</h1>
            <button 
              onClick={onCancel} 
              className="text-primary-500 hover:text-primary-600 flex items-center"
            >
              <X className="mr-1" size={18} /> Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveSection("basic")}
                  className={`py-2 px-4 border-b-2 ${
                    activeSection === "basic" 
                      ? "border-primary-500 text-primary-600" 
                      : "border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Basic Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("team")}
                  className={`py-2 px-4 border-b-2 ${
                    activeSection === "team" 
                      ? "border-primary-500 text-primary-600" 
                      : "border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Team Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("timeline")}
                  className={`py-2 px-4 border-b-2 ${
                    activeSection === "timeline" 
                      ? "border-primary-500 text-primary-600" 
                      : "border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Timeline
                </button>
              </div>
              
              {/* Basic Information */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Basic Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., CRM Migration"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="number">Project Number</Label>
                      <Input
                        id="number"
                        name="number"
                        placeholder="e.g., P1001"
                        value={formData.number || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">Module Name</Label>
                    <Input
                      id="moduleName"
                      name="moduleName"
                      placeholder="e.g., Customer Management"
                      value={formData.moduleName || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description of the project"
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? (
                              format(new Date(formData.startDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.startDate ? new Date(formData.startDate) : undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endDate ? (
                              format(new Date(formData.endDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.endDate ? new Date(formData.endDate) : undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Team Information */}
              {activeSection === "team" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Team Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pmName">Project Manager</Label>
                      <Input
                        id="pmName"
                        name="pmName"
                        value={formData.pmName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dlName">Delivery Lead</Label>
                      <Input
                        id="dlName"
                        name="dlName"
                        value={formData.dlName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="baName">Business Analyst</Label>
                      <Input
                        id="baName"
                        name="baName"
                        value={formData.baName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tlName">Technical Lead</Label>
                      <Input
                        id="tlName"
                        name="tlName"
                        value={formData.tlName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="uiLeadName">UI Lead</Label>
                      <Input
                        id="uiLeadName"
                        name="uiLeadName"
                        value={formData.uiLeadName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dbLeadName">DB Lead</Label>
                      <Input
                        id="dbLeadName"
                        name="dbLeadName"
                        value={formData.dbLeadName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="qaLeadName">QA Lead</Label>
                      <Input
                        id="qaLeadName"
                        name="qaLeadName"
                        value={formData.qaLeadName || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timeline Section */}
              {activeSection === "timeline" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Project Timeline</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-blue-700 text-sm">
                      Timeline milestones and phases will be automatically generated once the project is created.
                      You'll be able to adjust dates and details for each milestone afterward.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Project Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="startDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? (
                              format(new Date(formData.startDate), "PPP")
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.startDate ? new Date(formData.startDate) : undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Project Duration (Weeks)</Label>
                      <Select value={durationInWeeks.toString()} onValueChange={handleDurationChange}>
                        <SelectTrigger id="duration" className="w-full">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52].map(weeks => (
                            <SelectItem key={weeks} value={weeks.toString()}>
                              {weeks} week{weeks !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-700">Timeline Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Project Start Date</p>
                        <p className="font-medium">
                          {formData.startDate ? format(new Date(formData.startDate), "MMMM d, yyyy") : "Not set"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Project End Date (Calculated)</p>
                        <p className="font-medium">
                          {formData.endDate ? format(new Date(formData.endDate), "MMMM d, yyyy") : "Not set"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Project Duration</p>
                        <p className="font-medium">{durationInWeeks} weeks</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Milestones</p>
                        <p className="font-medium">9 standard phases</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-3">Standard Milestones</h3>
                    
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Requirement Gathering
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        BFRD Sign-off
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Configuration
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        SIT-IN
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        UAT
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Security
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Cut-off
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Go-Live
                      </li>
                      <li className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Hypercare
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !formData.name}
                >
                  {isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectForm;
