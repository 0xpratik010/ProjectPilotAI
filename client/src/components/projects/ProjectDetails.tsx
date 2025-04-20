import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project, Milestone, Subtask, Issue } from "@shared/schema";
import { ArrowLeft, Share, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Timeline from "./Timeline";
import Issues from "./Issues";
import TeamMembers from "./TeamMembers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React from 'react';

interface ProjectDetailsProps {
  projectId: number;
  onBack: () => void;
}

const ProjectDetails = ({ projectId, onBack }: ProjectDetailsProps) => {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  const { data: milestones = [], isLoading: isLoadingMilestones } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`],
    enabled: !!projectId,
  });
  
  const { data: issues = [], isLoading: isLoadingIssues } = useQuery<Issue[]>({
    queryKey: [`/api/projects/${projectId}/issues`],
    enabled: !!projectId,
  });
  
  // Helper function to format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onBack();
    },
  });

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };
  
  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Project not found</h2>
        <p className="mt-2 text-gray-500">The requested project could not be found.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <Button 
                  variant="link" 
                  onClick={onBack} 
                  className="text-primary-500 hover:underline flex items-center mr-3 text-sm p-0"
                >
                  <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Button>
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              <p className="text-gray-500 mt-1">{project.description}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <Share size={16} className="mr-1.5" /> Share
              </Button>
              <Button size="sm" className="flex items-center">
                <Pencil size={16} className="mr-1.5" /> Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex items-center" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={16} className="mr-1.5" /> Delete
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Start Date</p>
              <p className="font-medium">{formatDate(project.startDate)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">End Date</p>
              <p className="font-medium">{formatDate(project.endDate)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Project Manager</p>
              <p className="font-medium">{project.pmName || "Not assigned"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <p className={`font-medium ${project.status === "At Risk" ? "text-amber-600" : ""}`}>
                {project.status} {issues.filter(i => i.status === "Open").length > 0 && `(${issues.filter(i => i.status === "Open").length} open issues)`}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${
                  project.status === "At Risk" 
                    ? "bg-amber-500" 
                    : project.progress && project.progress > 80 
                      ? "bg-green-500" 
                      : "bg-primary-500"
                } h-2.5 rounded-full`} 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Project Timeline */}
      <Timeline 
        projectId={projectId} 
        project={project}
        milestones={milestones} 
        isLoading={isLoadingMilestones} 
      />
      
      {/* Issues */}
      <Issues 
        projectId={projectId} 
        issues={issues} 
        isLoading={isLoadingIssues} 
      />
      
      {/* Team Members & Communications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TeamMembers project={project} />
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Communications</h2>
            
            <div className="space-y-3">
              <div className="border-b border-gray-200 pb-3">
                <p className="text-sm font-medium">UAT Status Update</p>
                <p className="text-xs text-gray-500 mt-1">Email sent on Nov 8, 2023</p>
                <p className="text-xs text-gray-600 mt-2">Weekly UAT status report highlighting current blockers and plan to address them.</p>
              </div>
              
              <div className="border-b border-gray-200 pb-3">
                <p className="text-sm font-medium">API Integration Issue Alert</p>
                <p className="text-xs text-gray-500 mt-1">Email sent on Nov 6, 2023</p>
                <p className="text-xs text-gray-600 mt-2">Notification to stakeholders about the payment gateway integration issues.</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Sprint Demo Feedback</p>
                <p className="text-xs text-gray-500 mt-1">Email sent on Nov 1, 2023</p>
                <p className="text-xs text-gray-600 mt-2">Summary of client feedback from Sprint Demo 2.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete the project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the project from your view. You won't be able to see it in your dashboard anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetails;
