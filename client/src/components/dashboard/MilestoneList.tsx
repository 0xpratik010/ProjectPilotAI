import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, User } from "lucide-react";
import { format, addDays, isBefore, isToday, addWeeks } from "date-fns";

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  owner: string | null;
  order: number;
  projectName?: string;
}

const MilestoneList = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // For a real application, we would query all upcoming milestones
  // Here we're generating them based on the projects we already have
  const upcomingMilestones: Milestone[] = [
    {
      id: 1,
      projectId: 1,
      name: "BFRD Sign-off",
      description: "Get BFRD approved by stakeholders",
      status: "In Progress",
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 1).toISOString(),
      owner: "Sarah Chen",
      order: 2,
      projectName: projects[0]?.name
    },
    {
      id: 2,
      projectId: 1,
      name: "UAT Kick-off",
      description: "Begin user acceptance testing",
      status: "Not Started",
      startDate: addDays(new Date(), 3).toISOString(),
      endDate: addDays(new Date(), 3).toISOString(),
      owner: "Michael Johnson",
      order: 5,
      projectName: projects[0]?.name
    },
    {
      id: 3,
      projectId: 2,
      name: "SIT-IN Start",
      description: "Begin system integration testing",
      status: "Not Started",
      startDate: addDays(new Date(), 5).toISOString(),
      endDate: addDays(new Date(), 10).toISOString(),
      owner: "Robert Smith",
      order: 4,
      projectName: projects[1]?.name
    }
  ];
  
  const getDueStatusStyle = (endDate: string | null) => {
    if (!endDate) return "text-gray-600";
    
    const date = new Date(endDate);
    if (isBefore(date, new Date()) && !isToday(date)) {
      return "text-red-600 font-medium";
    }
    if (isToday(date)) {
      return "text-red-600 font-medium";
    }
    const threeDaysFromNow = addDays(new Date(), 3);
    if (isBefore(date, threeDaysFromNow)) {
      return "text-amber-600 font-medium";
    }
    
    return "text-gray-600";
  };
  
  const getDueText = (endDate: string | null) => {
    if (!endDate) return "No due date";
    
    const date = new Date(endDate);
    if (isBefore(date, new Date()) && !isToday(date)) {
      return "Overdue";
    }
    if (isToday(date)) {
      return "Due Today";
    }
    const tomorrow = addDays(new Date(), 1);
    if (isToday(tomorrow)) {
      return "Due Tomorrow";
    }
    
    return `In ${format(date, 'd')} days`;
  };
  
  const getPriorityBadge = (endDate: string | null) => {
    if (!endDate) return (
      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">Normal Priority</span>
    );
    
    const date = new Date(endDate);
    if (isBefore(date, new Date()) || isToday(date)) {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">High Priority</span>
      );
    }
    
    const threeDaysFromNow = addDays(new Date(), 3);
    if (isBefore(date, threeDaysFromNow)) {
      return (
        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">Medium Priority</span>
      );
    }
    
    return (
      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">Normal Priority</span>
    );
  };
  
  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 flex-shrink-0"><Flag size={20} /></div>;
      case "In Progress":
        return <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-3 flex-shrink-0"><Flag size={20} /></div>;
      case "At Risk":
        return <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3 flex-shrink-0"><Flag size={20} /></div>;
      default:
        return <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3 flex-shrink-0"><Flag size={20} /></div>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Upcoming Milestones</h2>
        <button className="text-primary-500 hover:text-primary-600 text-sm font-medium">
          View All
        </button>
      </div>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0 divide-y divide-gray-200">
          {upcomingMilestones.map(milestone => (
            <div key={milestone.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  {getMilestoneIcon(milestone.status)}
                  <div>
                    <h4 className="font-medium text-gray-800">{milestone.name}</h4>
                    <p className="text-gray-500 text-sm">{milestone.projectName || "Unknown Project"}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${getDueStatusStyle(milestone.endDate)}`}>
                  {milestone.endDate ? getDueText(milestone.endDate) : "No due date"}
                </span>
              </div>
              <div className="ml-13 pl-3 mt-2 flex items-center text-xs text-gray-500">
                <span className="flex items-center mr-4">
                  <User size={12} className="mr-1" /> {milestone.owner || "Unassigned"}
                </span>
                {getPriorityBadge(milestone.endDate)}
              </div>
            </div>
          ))}
          
          {upcomingMilestones.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No upcoming milestones found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneList;
