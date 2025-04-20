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

type FormFields = keyof InsertProject;

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
    email: "",
    startDate: "",
    endDate: "",
    timelineConfig: {
      milestones: {
        "Requirement Gathering": { weeks: 2 },
        "BFRD Sign-off": { weeks: 2 },
        "Configuration": { weeks: 4 },
        "SIT-IN": { weeks: 3 },
        "UAT": { weeks: 3 },
        "Security": { weeks: 1 },
        "Cut-Over": { weeks: 1 },
        "Go-Live": { weeks: 1 },
        "Hypercare": { weeks: 2 }
      }
    }
  });
  
  const [activeSection, setActiveSection] = useState("basic");
  const [durationInWeeks, setDurationInWeeks] = useState<number>(12);
  const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
  
  useEffect(() => {
    if (formData.startDate) {
      const calculatedEndDate = addWeeks(new Date(formData.startDate), durationInWeeks);
      setFormData(prev => ({ 
        ...prev, 
        endDate: calculatedEndDate.toISOString()
      }));
    }
  }, [formData.startDate, durationInWeeks]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const field = name as FormFields;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Partial<Record<FormFields, string>> = {};
    const requiredFields: FormFields[] = [
      'name', 'pmName', 'dlName', 'baName', 'tlName', 
      'uiLeadName', 'dbLeadName', 'qaLeadName', 'email', 
      'startDate'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
      }
    });

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (validateForm()) {
      mutate();
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Project</h1>
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
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("team")}
                className={`py-2 px-4 border-b-2 ${
                  activeSection === "team" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Team
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("timeline")}
                className={`py-2 px-4 border-b-2 ${
                  activeSection === "timeline" 
                    ? "border-primary-500 text-primary-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Timeline
              </button>
            </div>
            
            {/* Basic Info Section */}
            {activeSection === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="number">Project Number</Label>
                    <Input
                      id="number"
                      name="number"
                      value={formData.number || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="moduleName">Module Name</Label>
                  <Input
                    id="moduleName"
                    name="moduleName"
                    value={formData.moduleName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>
            )}
            
            {/* Team Section */}
            {activeSection === "team" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pmName">Project Manager *</Label>
                    <Input
                      id="pmName"
                      name="pmName"
                      value={formData.pmName || ""}
                      onChange={handleInputChange}
                      className={errors.pmName ? "border-red-500" : ""}
                    />
                    {errors.pmName && <p className="text-xs text-red-500 mt-1">{errors.pmName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="dlName">Delivery Lead *</Label>
                    <Input
                      id="dlName"
                      name="dlName"
                      value={formData.dlName || ""}
                      onChange={handleInputChange}
                      className={errors.dlName ? "border-red-500" : ""}
                    />
                    {errors.dlName && <p className="text-xs text-red-500 mt-1">{errors.dlName}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baName">Business Analyst *</Label>
                    <Input
                      id="baName"
                      name="baName"
                      value={formData.baName || ""}
                      onChange={handleInputChange}
                      className={errors.baName ? "border-red-500" : ""}
                    />
                    {errors.baName && <p className="text-xs text-red-500 mt-1">{errors.baName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="tlName">Tech Lead *</Label>
                    <Input
                      id="tlName"
                      name="tlName"
                      value={formData.tlName || ""}
                      onChange={handleInputChange}
                      className={errors.tlName ? "border-red-500" : ""}
                    />
                    {errors.tlName && <p className="text-xs text-red-500 mt-1">{errors.tlName}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="uiLeadName">UI Lead *</Label>
                    <Input
                      id="uiLeadName"
                      name="uiLeadName"
                      value={formData.uiLeadName || ""}
                      onChange={handleInputChange}
                      className={errors.uiLeadName ? "border-red-500" : ""}
                    />
                    {errors.uiLeadName && <p className="text-xs text-red-500 mt-1">{errors.uiLeadName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="dbLeadName">DB Lead *</Label>
                    <Input
                      id="dbLeadName"
                      name="dbLeadName"
                      value={formData.dbLeadName || ""}
                      onChange={handleInputChange}
                      className={errors.dbLeadName ? "border-red-500" : ""}
                    />
                    {errors.dbLeadName && <p className="text-xs text-red-500 mt-1">{errors.dbLeadName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="qaLeadName">QA Lead *</Label>
                    <Input
                      id="qaLeadName"
                      name="qaLeadName"
                      value={formData.qaLeadName || ""}
                      onChange={handleInputChange}
                      className={errors.qaLeadName ? "border-red-500" : ""}
                    />
                    {errors.qaLeadName && <p className="text-xs text-red-500 mt-1">{errors.qaLeadName}</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Timeline Section */}
            {activeSection === "timeline" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Project Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground",
                            errors.startDate && "border-red-500"
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({
                                ...prev,
                                startDate: date.toISOString()
                              }));
                              if (errors.startDate) {
                                setErrors(prev => ({ ...prev, startDate: "" }));
                              }
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Project Duration (Weeks)</Label>
                    <Select
                      value={durationInWeeks.toString()}
                      onValueChange={(value) => setDurationInWeeks(parseInt(value))}
                    >
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
                  <h3 className="text-md font-medium text-gray-700 mb-3">Project Critical Milestones</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(formData.timelineConfig?.milestones || {}).map(([milestone, config]) => (
                      <div key={milestone} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label>{milestone}</Label>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="1"
                            max="52"
                            value={config.weeks}
                            onChange={(e) => {
                              const weeks = parseInt(e.target.value) || 1;
                              setFormData(prev => ({
                                ...prev,
                                timelineConfig: {
                                  ...prev.timelineConfig,
                                  milestones: {
                                    ...prev.timelineConfig?.milestones,
                                    [milestone]: { weeks: Math.min(52, Math.max(1, weeks)) }
                                  }
                                }
                              }));
                            }}
                            className="w-full"
                          />
                        </div>
                        <div className="w-16 text-sm text-gray-500">weeks</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    * Adjust the duration for each milestone phase
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Standard Milestones</h3>
                  
                  <ul className="space-y-2 text-sm">
                    {Object.keys(formData.timelineConfig?.milestones || {}).map(milestone => (
                      <li key={milestone} className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
              {/* <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button> */}
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
