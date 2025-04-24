import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Issue } from "@shared/schema";
import { AlertTriangle, XCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IssuesProps {
  projectId: number;
  issues: Issue[];
  isLoading: boolean;
}

const Issues = ({ projectId, issues, isLoading }: IssuesProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    owner: ''
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/issues", {
        projectId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "Open",
        owner: formData.owner,
        reportedBy: "John Doe" // This would come from auth system
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/issues`] });
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        owner: ''
      });
      toast({
        title: "Issue created",
        description: "The issue has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating issue",
        description: error.message || "There was a problem creating the issue",
        variant: "destructive"
      });
    }
  });
  
  const getIssuePriorityStyles = (priority: string) => {
    switch (priority) {
      case "High":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          badge: "bg-red-200 text-red-800"
        };
      case "Medium":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          badge: "bg-amber-200 text-amber-800"
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          badge: "bg-blue-200 text-blue-800"
        };
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Validation error",
        description: "Issue title is required",
        variant: "destructive"
      });
      return;
    }
    mutate();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Current Issues</h2>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const openIssues = issues.filter(issue => issue.status?.toLowerCase() === "open");
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Current Issues ({openIssues.length})</h2>
          <Button 
            size="sm" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "Add Issue"}
          </Button>
        </div>
        
        {showCreateForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <input
                    type="text"
                    id="owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                    placeholder="Who will resolve this issue?"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Issue"}
                </Button>
              </div>
            </div>
          </form>
        )}
        
        <div className="space-y-4">
          {openIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No open issues for this project
            </div>
          ) : (
            openIssues.map(issue => {
              const styles = getIssuePriorityStyles(issue.priority);
              
              return (
                <div key={issue.id} className={`p-3 ${styles.bg} border ${styles.border} rounded-md`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-medium ${styles.text}`}>{issue.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium ${styles.badge} rounded-full`}>
                      {issue.priority}
                    </span>
                  </div>
                  <p className={`text-sm ${styles.text} mb-2`}>{issue.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span className="flex items-center">
                      <User size={12} className="mr-1" /> {issue.owner || "Unassigned"}
                    </span>
                    <span>
                      {issue.createdAt ? `Reported ${new Date(issue.createdAt).toLocaleDateString()}` : "Recently reported"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Issues;
