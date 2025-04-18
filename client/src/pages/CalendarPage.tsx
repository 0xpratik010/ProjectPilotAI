import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Project } from "@shared/schema";
import { addDays, format, isSameDay, startOfMonth } from "date-fns";
import { CalendarClock, Clock, CheckSquare } from "lucide-react";

// Define a local interface for milestones to avoid type mismatch
interface CalendarMilestone {
  id: number;
  projectId: number;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  owner: string | null;
  createdAt: string;
  order: number;
}

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // This would be replaced with actual milestone data from API
  const getMilestonesForDate = (date: Date | undefined) => {
    if (!date) return [];
    
    // Generate milestone dates for sample data
    const startDate = startOfMonth(new Date());
    
    const milestones: CalendarMilestone[] = [
      {
        id: 1,
        projectId: 1,
        name: "BFRD Sign-off",
        description: "Get BFRD approved by stakeholders",
        status: "In Progress",
        startDate: addDays(startDate, 2).toISOString(),
        endDate: addDays(startDate, 3).toISOString(),
        owner: "Sarah Chen",
        createdAt: startDate.toISOString(),
        order: 2
      },
      {
        id: 2,
        projectId: 1,
        name: "UAT Kick-off",
        description: "Begin user acceptance testing",
        status: "Not Started",
        startDate: addDays(startDate, 8).toISOString(),
        endDate: addDays(startDate, 8).toISOString(),
        owner: "Michael Johnson",
        createdAt: startDate.toISOString(),
        order: 5
      },
      {
        id: 3,
        projectId: 2,
        name: "SIT-IN Start",
        description: "Begin system integration testing",
        status: "Not Started",
        startDate: addDays(startDate, 12).toISOString(),
        endDate: addDays(startDate, 20).toISOString(),
        owner: "Robert Smith",
        createdAt: startDate.toISOString(),
        order: 4
      },
      {
        id: 4,
        projectId: 3,
        name: "Security Review",
        description: "Complete security assessment",
        status: "Not Started",
        startDate: addDays(startDate, 15).toISOString(),
        endDate: addDays(startDate, 18).toISOString(),
        owner: "James Wilson",
        createdAt: startDate.toISOString(),
        order: 6
      },
      {
        id: 5,
        projectId: 2,
        name: "Go-Live Preparation",
        description: "Finalize deployment plan",
        status: "Not Started",
        startDate: addDays(startDate, 25).toISOString(),
        endDate: addDays(startDate, 27).toISOString(),
        owner: "Emily Davis",
        createdAt: startDate.toISOString(),
        order: 8
      },
    ];
    
    return milestones.filter(milestone => {
      if (!milestone.startDate) return false;
      return isSameDay(new Date(milestone.startDate), date) || 
             (milestone.endDate ? isSameDay(new Date(milestone.endDate), date) : false);
    });
  };
  
  const findProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  const selectedDayMilestones = getMilestonesForDate(date);
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Project Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
              modifiers={{
                milestone: getMilestonesForDate(date).map(milestone => 
                  new Date(milestone.startDate || "")
                )
              }}
              modifiersClassNames={{
                milestone: "bg-primary-100 text-primary-600 font-medium"
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <CalendarClock size={20} className="mr-2 text-primary-500" />
              <h2 className="text-lg font-semibold">
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
              </h2>
            </div>
            
            {selectedDayMilestones.length > 0 ? (
              <div className="space-y-4">
                {selectedDayMilestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-800">{milestone.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        milestone.status === "Completed" ? "bg-green-100 text-green-800" :
                        milestone.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {findProjectName(milestone.projectId)}
                    </p>
                    <div className="flex items-center text-xs">
                      {milestone.startDate && milestone.endDate && milestone.startDate !== milestone.endDate ? (
                        <span className="flex items-center text-gray-600">
                          <Clock size={12} className="mr-1" /> 
                          {format(new Date(milestone.startDate), "MMM d")} - {format(new Date(milestone.endDate), "MMM d")}
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-600">
                          <CheckSquare size={12} className="mr-1" /> Due today
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No milestones scheduled for this date
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;