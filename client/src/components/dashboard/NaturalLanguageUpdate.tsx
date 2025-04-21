import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const NaturalLanguageUpdate = () => {
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<{ sender: "user" | "ai"; message: string }[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendToAI = async (text: string) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/ai/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, sessionId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "AI Quick Update failed.");
      }
      if (data.followUp) {
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: data.question },
        ]);
      } else if (data.created) {
        setConversation((prev) => [
          ...prev,
          { sender: "ai", message: data.message },
        ]);
        toast({
          title: "Created!",
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "AI Quick Update failed.",
        variant: "destructive"
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setConversation((prev) => [
      ...prev,
      { sender: "user", message: inputText },
    ]);
    await sendToAI(inputText);
    setInputText("");
    inputRef.current?.focus();
  };

  return (
    <Card className="dark:bg-card dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
      <CardHeader>
        <CardTitle className="text-gray-700 dark:text-gray-200 text-base">Quick Update (AI)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700 text-sm">
          {conversation.length === 0 && <div className="text-gray-400">Start a Quick Update with natural language!</div>}
          {conversation.map((msg, idx) => (
            <div key={idx} className={msg.sender === "user" ? "text-right" : "text-left text-primary"}>
              <span className="inline-block px-2 py-1 rounded-lg" style={{ background: msg.sender === "user" ? "#e0e7ef" : "#c7d2fe" }}>{msg.message}</span>
            </div>
          ))}
        </div>
        <div className="relative">
          <Textarea
            ref={inputRef}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary focus:border-primary-500 dark:focus:border-primary p-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-200 min-h-[80px]"
            placeholder="Describe your update, e.g. 'Add a high-priority bug for login failure assigned to Alice due tomorrow.'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isPending}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleSubmit} disabled={isPending || !inputText.trim()}>
              <Send size={16} className="mr-1" /> {isPending ? "Processing..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageUpdate;
