import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectAssistantProps {
  projectId: number;
}

export function ProjectAssistant({ projectId }: ProjectAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assistantMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/assistant`, {
        prompt
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries based on the response type
      if ('milestoneId' in data.result) {
        queryClient.invalidateQueries(["subtasks"]);
      } else if ('priority' in data.result) {
        queryClient.invalidateQueries(["issues"]);
      }
      
      toast({
        title: "Success",
        description: "Your request has been processed successfully.",
      });
      setPrompt("");
    },
    onError: (error) => {
      console.error("Error processing prompt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    assistantMutation.mutate(prompt);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Project Assistant</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything about the project or tell me about updates..."
          className="min-h-[100px]"
        />
        <Button 
          type="submit" 
          disabled={assistantMutation.isPending || !prompt.trim()}
          className="w-full"
        >
          {assistantMutation.isPending ? "Processing..." : "Send"}
        </Button>
      </form>
      
      <div className="text-sm text-gray-500">
        <p>Example prompts:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>"The project is delayed by 2 days due to API integration issues"</li>
          <li>"Add a subtask Review Documentation in UAT phase and assign to John"</li>
          <li>"What's the current project status?"</li>
        </ul>
      </div>
    </div>
  );
}
