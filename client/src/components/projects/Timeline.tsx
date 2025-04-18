import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Milestone, Subtask } from "@shared/schema";
import { Check, Clock, CheckCircle2, CircleDot } from "lucide-react";
import { format } from "date-fns";

interface TimelineProps {
  projectId: number;
  milestones: Milestone[];
  isLoading: boolean;
}

const Timeline = ({ projectId, milestones, isLoading }: TimelineProps) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  
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
  
  // Status indicator components
  const getMilestoneStatusIndicator = (status: string) => {
    switch (status) {
      case "Completed":
        return <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <Check size={18} />
        </div>;
      case "In Progress":
        return <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <Clock size={18} />
        </div>;
      case "At Risk":
        return <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white absolute -left-10 timeline-dot">
          <Clock size={18} />
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
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mt-0.5 mr-2">
          <CircleDot size={12} />
        </div>;
    }
  };
  
  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Completed
        </span>;
      case "In Progress":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          In Progress
        </span>;
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
  const getMilestoneBorderColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "border-green-500";
      case "In Progress":
        return "border-blue-500";
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
              
              return (
                <div key={milestone.id} className="relative">
                  {getMilestoneStatusIndicator(milestone.status)}
                  
                  <div 
                    className={`bg-gray-50 rounded-lg p-4 border-l-4 ${getMilestoneBorderColor(milestone.status)} cursor-pointer`}
                    onClick={() => toggleMilestone(milestone.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{milestone.name}</h3>
                      {getStatusBadge(milestone.status)}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-3">
                      {milestone.startDate ? formatDate(milestone.startDate) : "Not started"} - {milestone.endDate ? formatDate(milestone.endDate) : "No end date"}
                    </p>
                    
                    {isExpanded && (
                      <div className="space-y-3">
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
