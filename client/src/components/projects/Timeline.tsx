import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Milestone, Subtask, Project, Issue } from "@shared/schema";
import { Check, Clock, CheckCircle2, CircleDot, AlertCircle, AlertTriangle, Lightbulb, Bug, Pencil } from "lucide-react";
import { format, isAfter, differenceInDays, addWeeks } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TimelineProps {
  projectId: number;
  project: Project;
  milestones: Milestone[];
  isLoading: boolean;
}

type SeverityLevel = "green" | "orange" | "red";

interface MilestoneStatus {
  level: SeverityLevel;
  message: string;
}

interface MilestoneConfig {
  weeks: number;
}

interface TimelineConfig {
  milestones: Record<string, MilestoneConfig>;
}

const Timeline = ({ projectId, project, milestones, isLoading }: TimelineProps) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [showRecoverySuggestions, setShowRecoverySuggestions] = useState<Record<number, boolean>>({});
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    name: "",
    description: "",
    dueDate: new Date(),
    assignedTo: "",
  });

  const queryClient = useQueryClient();

  // Fetch subtasks and issues for all milestones
  const { data: subtasksMap = {} } = useQuery<Record<number, Subtask[]>>({
    queryKey: [`/api/projects/${projectId}/milestones/subtasks`],
    queryFn: async () => {
      const result: Record<number, Subtask[]> = {};
      for (const milestone of milestones) {
        const response = await fetch(`/api/milestones/${milestone.id}/subtasks`, {
          credentials: 'include',
        });
        if (response.ok) {
          result[milestone.id] = await response.json();
        }
      }
      return result;
    },
    enabled: !!projectId && milestones.length > 0,
  });

  const { data: issuesMap = {} } = useQuery<Record<number, Issue[]>>({
    queryKey: [`/api/projects/${projectId}/milestones/issues`],
    queryFn: async () => {
      const result: Record<number, Issue[]> = {};
      for (const milestone of milestones) {
        const response = await fetch(`/api/milestones/${milestone.id}/issues`, {
          credentials: 'include',
        });
        if (response.ok) {
          result[milestone.id] = await response.json();
        }
      }
      return result;
    },
    enabled: !!projectId && milestones.length > 0,
  });

  const { data: milestonesData } = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/milestones`);
      return res.json();
    },
  });

  const { data: subtasks, isLoading: isLoadingSubtasks } = useQuery({
    queryKey: ["subtasks", selectedMilestone],
    queryFn: async () => {
      if (!selectedMilestone) return [];
      const res = await apiRequest("GET", `/api/milestones/${selectedMilestone}/subtasks`);
      return res.json();
    },
    enabled: !!selectedMilestone,
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending subtask creation request:", data);
      const res = await apiRequest("POST", `/api/milestones/${data.milestoneId}/subtasks`, {
        name: data.name,
        description: data.description,
        endDate: data.endDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", selectedMilestone] });
      setIsAddingSubtask(false);
      setNewSubtask({ name: "", description: "", dueDate: new Date(), assignedTo: "" });
    },
    onError: (error) => {
      console.error("Error creating subtask:", error);
      // You might want to show an error toast here
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/subtasks/${id}`, {
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", selectedMilestone] });
    },
  });

  // Calculate milestone dates based on project start date and timeline config
  const calculateMilestoneDates = () => {
    if (!project.startDate || !project.timelineConfig) return;

    const timelineConfig = project.timelineConfig as TimelineConfig;
    if (!timelineConfig.milestones) return;

    let currentDate = new Date(project.startDate);
    const milestoneDates: Record<string, { start: Date; end: Date }> = {};

    Object.entries(timelineConfig.milestones).forEach(([name, config]) => {
      const startDate = new Date(currentDate);
      const endDate = addWeeks(startDate, config.weeks);
      milestoneDates[name] = { start: startDate, end: endDate };
      currentDate = endDate;
    });

    return milestoneDates;
  };

  const milestoneDates = calculateMilestoneDates();

  const toggleMilestone = (milestoneId: number) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  const toggleRecoverySuggestions = (milestoneId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowRecoverySuggestions(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // Calculate severity status for a milestone
  const getMilestoneSeverity = (milestone: Milestone): MilestoneStatus => {
    if (milestone.status === "Completed") {
      return { level: "green", message: "Milestone completed successfully" };
    }

    if (!milestone.endDate) {
      return { level: "green", message: "No end date set" };
    }

    const today = new Date();
    const endDate = new Date(milestone.endDate);

    // If the end date has passed and the milestone isn't completed
    if (isAfter(today, endDate)) {
      const daysLate = differenceInDays(today, endDate);

      if (daysLate > 14) {
        return { 
          level: "red", 
          message: `Critical: ${daysLate} days past deadline`
        };
      } else if (daysLate > 7) {
        return { 
          level: "orange", 
          message: `At risk: ${daysLate} days past deadline`
        };
      } else {
        return { 
          level: "orange", 
          message: `Slightly delayed: ${daysLate} days past deadline`
        };
      }
    } 

    // If the end date is approaching within 7 days
    const daysUntilDeadline = differenceInDays(endDate, today);
    if (daysUntilDeadline <= 7 && milestone.status !== "Completed") {
      return { 
        level: "orange", 
        message: `Deadline approaching: ${daysUntilDeadline} days remaining`
      };
    }

    return { level: "green", message: "On track" };
  };

  // Status indicator components
  const getMilestoneStatusIndicator = (milestone: Milestone) => {
    const severity = getMilestoneSeverity(milestone);

    switch (milestone.status) {
      case "Completed":
        return <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <Check size={18} />
        </div>;
      case "In Progress":
        if (severity.level === "red") {
          return <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
            <AlertCircle size={18} />
          </div>;
        } else if (severity.level === "orange") {
          return <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
            <AlertTriangle size={18} />
          </div>;
        } else {
          return <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
            <Clock size={18} />
          </div>;
        }
      case "At Risk":
        return <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <AlertTriangle size={18} />
        </div>;
      default:
        return <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <CircleDot size={18} />
        </div>;
    }
  };

  const getSubtaskStatusIndicator = (status: string) => {
    switch (status) {
      case "Completed":
        return <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-500 mt-0.5 mr-2">
          <Check size={12} />
        </div>;
      case "In Progress":
        return <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mt-0.5 mr-2">
          <Clock size={12} />
        </div>;
      case "At Risk":
        return <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mt-0.5 mr-2">
          <AlertTriangle size={12} />
        </div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mt-0.5 mr-2">
          <CircleDot size={12} />
        </div>;
    }
  };

  // Status badge component
  const getStatusBadge = (milestone: Milestone) => {
    const severity = getMilestoneSeverity(milestone);

    switch (milestone.status) {
      case "Completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Completed
        </span>;
      case "In Progress":
        if (severity.level === "red") {
          return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
            <AlertCircle size={10} className="mr-1" /> Critical Delay
          </span>;
        } else if (severity.level === "orange") {
          return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full flex items-center">
            <AlertTriangle size={10} className="mr-1" /> At Risk
          </span>;
        } else {
          return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            In Progress
          </span>;
        }
      case "At Risk":
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
          At Risk
        </span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
          Not Started
        </span>;
    }
  };

  // Border color based on status
  const getMilestoneBorderColor = (milestone: Milestone) => {
    const severity = getMilestoneSeverity(milestone);

    switch (milestone.status) {
      case "Completed":
        return "border-green-500";
      case "In Progress":
        if (severity.level === "red") {
          return "border-red-500";
        } else if (severity.level === "orange") {
          return "border-amber-500";
        } else {
          return "border-blue-500";
        }
      case "At Risk":
        return "border-amber-500";
      default:
        return "border-gray-300";
    }
  };

  // Date formatter
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Recovery suggestions based on milestone issues
  const getRecoverySuggestions = (milestone: Milestone) => {
    const severity = getMilestoneSeverity(milestone);

    if (severity.level === "green") {
      return ["This milestone is on track. Continue monitoring progress."];
    }

    const suggestions = [];

    if (severity.level === "red") {
      suggestions.push(
        "Escalate to senior management for immediate intervention",
        "Schedule an emergency meeting with all stakeholders",
        "Consider reallocating resources from lower priority projects",
        "Identify critical path tasks and focus efforts there"
      );
    } else if (severity.level === "orange") {
      suggestions.push(
        "Increase monitoring frequency and add regular check-ins",
        "Identify bottlenecks and allocate additional resources",
        "Review and potentially adjust the timeline of dependent milestones",
        "Assign a dedicated resource to focus on this milestone"
      );
    }

    return suggestions;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Project Timeline</h2>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {milestonesData?.map((milestone: any) => (
          <div key={milestone.id} className="relative mb-8 ml-8">
            <div className="absolute -left-10 top-2 w-4 h-4 rounded-full bg-gray-200"></div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{milestone.name}</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {milestone.startDate ? format(new Date(milestone.startDate), "MMM d") : "Not set"} - {milestone.endDate ? format(new Date(milestone.endDate), "MMM d") : "Not set"}
                  </p>
                </div>
                <span className="px-2 py-1 text-sm rounded-full bg-gray-100">{milestone.status}</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Subtasks</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMilestone(milestone.id);
                      setIsAddingSubtask(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subtask
                  </Button>
                </div>

                {milestone.id === selectedMilestone && (
                  <Dialog open={isAddingSubtask} onOpenChange={setIsAddingSubtask}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Subtask</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Name</label>
                          <Input
                            value={newSubtask.name}
                            onChange={(e) => setNewSubtask({ ...newSubtask, name: e.target.value })}
                            placeholder="Enter subtask name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Description</label>
                          <Textarea
                            value={newSubtask.description}
                            onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                            placeholder="Enter subtask description"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Assigned to</label>
                          <Input
                            value={newSubtask.assignedTo || ''}
                            onChange={(e) => setNewSubtask({ ...newSubtask, assignedTo: e.target.value })}
                            placeholder="Enter assignee name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Due Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newSubtask.dueDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newSubtask.dueDate ? format(newSubtask.dueDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={newSubtask.dueDate}
                                onSelect={(date) => setNewSubtask({ ...newSubtask, dueDate: date || new Date() })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddingSubtask(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              addSubtaskMutation.mutate({
                                milestoneId: selectedMilestone,
                                name: newSubtask.name,
                                description: newSubtask.description,
                                assignedTo: newSubtask.assignedTo,
                                endDate: newSubtask.dueDate.toISOString().split('T')[0],
                              });
                            }}
                          >
                            Add Subtask
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <div className="space-y-2">
                  {subtasks?.map((subtask: any) => (
                    <div
                      key={subtask.id}
                      className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <h5 className="font-medium">{subtask.name}</h5>
                        <p className="text-sm text-gray-500">{subtask.description}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {subtask.assignedTo || 'Unassigned'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(subtask.endDate), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateSubtaskMutation.mutate({
                              id: subtask.id,
                              status: subtask.status === "Completed" ? "In Progress" : "Completed",
                            });
                          }}
                        >
                          {subtask.status === "Completed" ? "Mark Incomplete" : "Mark Complete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!subtasks || subtasks.length === 0) && (
                    <p className="text-sm text-gray-500">No subtasks found for this milestone</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
