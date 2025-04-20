import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NaturalLanguageUpdate = () => {
  const [updateText, setUpdateText] = useState("");
  const [projectId, setProjectId] = useState(1); // Default to first project for demo
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!updateText.trim()) {
        throw new Error("Please enter an update message");
      }
      
      const res = await apiRequest("POST", "/api/updates", {
        projectId,
        content: updateText,
        createdBy: "John Doe" // This would come from the auth system
      });
      
      return res.json();
    },
    onSuccess: () => {
      setUpdateText("");
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/updates`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/issues`] });
      
      toast({
        title: "Update processed",
        description: "Your update has been processed and relevant items have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error processing update",
        description: error.message || "There was an error processing your update.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = () => {
    mutate();
  };
  
  return (
    <Card className="dark:bg-card dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
      <CardHeader>
        <CardTitle className="text-gray-700 dark:text-gray-200 text-base">Quick Update</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary focus:border-primary-500 dark:focus:border-primary p-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-200 min-h-[120px]"
            placeholder="Enter a natural language update (e.g., 'The CRM Migration project is delayed by 2 days due to API integration issues. SIT phase will be affected.')"
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            disabled={isPending}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              <Send size={16} className="mr-1" /> {isPending ? "Processing..." : "Process Update"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageUpdate;
