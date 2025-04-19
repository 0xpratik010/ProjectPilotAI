import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Milestone, Subtask } from "@shared/schema";
import { Check, Clock, CheckCircle2, CircleDot, AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { format, isAfter, differenceInDays } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface TimelineProps {
  projectId: number;
  milestones: Milestone[];
  isLoading: boolean;
}

type SeverityLevel = "green" | "orange" | "red";

interface MilestoneStatus {
  level: SeverityLevel;
  message: string;
}

const Timeline = ({ projectId, milestones, isLoading }: TimelineProps) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [showRecoverySuggestions, setShowRecoverySuggestions] = useState<Record<number, boolean>>({});
  
  // Fetch subtasks for all milestones
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
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
        
        {milestones.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No milestones found for this project
          </div>
        ) : (
          <div className="relative timeline-container pl-10 space-y-8">
            {milestones.map((milestone) => {
              const subtasks = subtasksMap[milestone.id] || [];
              const isExpanded = expandedMilestones[milestone.id];
              const severity = getMilestoneSeverity(milestone);
              const showSuggestions = showRecoverySuggestions[milestone.id];
              
              return (
                <div key={milestone.id} className="relative">
                  {getMilestoneStatusIndicator(milestone)}
                  
                  <div 
                    className={`bg-gray-50 rounded-lg p-4 border-l-4 ${getMilestoneBorderColor(milestone)} cursor-pointer transition-all duration-200 hover:shadow-md`}
                    onClick={() => toggleMilestone(milestone.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{milestone.name}</h3>
                      {getStatusBadge(milestone)}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500">
                        {milestone.startDate ? formatDate(milestone.startDate) : "Not started"} - {milestone.endDate ? formatDate(milestone.endDate) : "No end date"}
                      </p>
                      
                      {(severity.level === "orange" || severity.level === "red") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs" 
                                onClick={(e) => toggleRecoverySuggestions(milestone.id, e)}
                              >
                                <Lightbulb size={14} className="mr-1" />
                                Recovery Tips
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>AI-powered suggestions to get back on track</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    {severity.level !== "green" && (
                      <div className={`p-2 rounded-md mb-3 ${
                        severity.level === "red" 
                          ? "bg-red-50 text-red-800 border border-red-200" 
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        <p className="text-xs">{severity.message}</p>
                      </div>
                    )}
                    
                    {showSuggestions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                          <Lightbulb size={14} className="mr-1" />
                          AI Recovery Suggestions
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1 pl-5 list-disc">
                          {getRecoverySuggestions(milestone).map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {isExpanded && (
                      <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium">Subtasks</h4>
                        {subtasks.length > 0 ? (
                          subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-start text-sm">
                              {getSubtaskStatusIndicator(subtask.status)}
                              <div>
                                <p className="font-medium">{subtask.name}</p>
                                <p className={`text-xs ${subtask.status === "Completed" ? "text-gray-500" : subtask.status === "In Progress" ? "text-blue-600" : "text-gray-500"}`}>
                                  {subtask.status === "Completed" 
                                    ? `Completed${subtask.endDate ? ` on ${formatDate(subtask.endDate)}` : ''}` 
                                    : subtask.status === "In Progress"
                                      ? "In Progress"
                                      : subtask.startDate 
                                        ? `Scheduled for ${formatDate(subtask.startDate)}`
                                        : "Not scheduled"}
                                  {subtask.owner && ` • Owner: ${subtask.owner}`}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No subtasks found for this milestone</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timeline;
