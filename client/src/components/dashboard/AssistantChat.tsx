import { useEffect, useState, useRef } from "react";
import { Send, RefreshCw, Bot, User, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const AssistantChat = () => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat'],
  });
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return null;
      
      const res = await apiRequest("POST", "/api/chat", {
        projectId: null, // Global chat
        role: "user",
        content: message,
      });
      
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isPending) return;
    mutate();
  };
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
  };
  
  return (
    <Card className="dark:bg-card dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
      <CardHeader className="flex flex-row justify-between items-center pb-3">
        <CardTitle className="text-gray-700 dark:text-gray-200 text-base">Project Assistant</CardTitle>
        <button onClick={handleRefresh} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
          <RefreshCw size={16} />
        </button>
      </CardHeader>
      
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 h-[250px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 dark:border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Bot size={32} className="mb-2" />
              <p>No messages yet. Ask something to get started!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="flex items-start mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                  msg.role === "assistant" 
                    ? "bg-primary-100 dark:bg-primary/20 text-primary-500 dark:text-primary" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                }`}>
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="text-sm">
                  {msg.role === "assistant" && msg.content.includes("at risk") ? (
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Based on current progress, 3 projects are at risk:</p>
                      <ul className="mt-1 space-y-1">
                        <li className="flex items-center">
                          <AlertTriangle size={12} className="text-red-500 dark:text-red-400 mr-1" /> 
                          <span className="dark:text-gray-300">CRM Migration (UAT phase delayed by 3 days)</span>
                        </li>
                        <li className="flex items-center">
                          <AlertTriangle size={12} className="text-amber-500 dark:text-amber-400 mr-1" /> 
                          <span className="dark:text-gray-300">ERP Implementation (Configuration phase at 65% completion)</span>
                        </li>
                        <li className="flex items-center">
                          <AlertTriangle size={12} className="text-amber-500 dark:text-amber-400 mr-1" /> 
                          <span className="dark:text-gray-300">Document Management System (SIT phase has 4 open blockers)</span>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <p className={`${msg.role === "assistant" ? "text-gray-600 dark:text-gray-300" : "text-gray-700 dark:text-gray-200"}`}>
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <Input 
            type="text" 
            className="w-full rounded-full border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary focus:border-primary-500 dark:focus:border-primary pl-4 pr-12 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            placeholder="Ask me anything about your projects..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-500 dark:text-primary hover:text-primary-600 dark:hover:text-primary/80 p-1"
            disabled={isPending || !message.trim()}
          >
            <Send size={16} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssistantChat;
