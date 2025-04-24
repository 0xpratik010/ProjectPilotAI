// AIIntentComponent.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AIIntentProps {
  onIssueCreated?: (issue: any) => void;
  className?: string;
}

const AIIntentComponent: React.FC<AIIntentProps> = ({ onIssueCreated, className }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);

  // Initialize or retrieve session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem('ai_intent_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('ai_intent_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: prompt }]);
    
    setLoading(true);
    try {
      console.log(`Sending prompt with session ID: ${sessionId}`);
      
      const result = await axios.post('/api/ai-intent', 
        { prompt }, 
        { headers: { 'x-session-id': sessionId } }
      );
      
      setResponse(result.data);
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: result.data.message 
      }]);
      
      // If issue was created successfully
      if (result.data.success && !result.data.followUp && result.data.issue) {
        if (onIssueCreated) {
          onIssueCreated(result.data.issue);
        }
        // Reset conversation after successful creation
        setConversation([]);
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Error sending prompt:', error);
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error processing your request. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    // Generate a new session ID
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ai_intent_session_id', newSessionId);
    setSessionId(newSessionId);
    setConversation([]);
    setResponse(null);
  };

  return (
    <div className={`ai-intent-component ${className || ''}`}>
      <div className="conversation-container">
        {conversation.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="prompt-form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your request (e.g., 'Create an issue called API Bug in Zephyr Migration')"
          disabled={loading}
          className="prompt-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Processing...' : 'Send'}
        </button>
        <button type="button" onClick={resetConversation} className="reset-button">
          New Conversation
        </button>
      </form>
      
      {response && response.followUp && response.missingFields && (
        <div className="missing-fields">
          <p>Please provide: {response.missingFields.join(', ')}</p>
          <div className="collected-info">
            <h4>Information collected so far:</h4>
            <ul>
              {Object.entries(response.collected || {}).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {String(value)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIIntentComponent;
