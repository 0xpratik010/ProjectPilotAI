// src/pages/AIIntentDemo.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIIntentComponent from '../components/AIIntentComponent';
import '../components/AIIntentComponent.css';

const AIIntentDemo: React.FC = () => {
  const navigate = useNavigate();
  const [createdIssue, setCreatedIssue] = useState<any>(null);

  const handleIssueCreated = (issue: any) => {
    console.log('Issue created:', issue);
    setCreatedIssue(issue);
  };

  const goToProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="ai-intent-demo">
      <h1>AI Intent Demo</h1>
      <p className="description">
        Use natural language to create issues or add subtasks. Try phrases like:
      </p>
      <ul className="examples">
        <li>"Create a high priority issue called API Integration Bug in Zephyr Migration"</li>
        <li>"Add an issue called Mobile App Crash in E-Commerce Platform and assign it to Pratik M"</li>
        <li>"Create a bug report for Healthcare Management System due in 3 days"</li>
      </ul>

      <div className="demo-container">
        <AIIntentComponent onIssueCreated={handleIssueCreated} />
      </div>

      {createdIssue && (
        <div className="success-panel">
          <h3>Issue Created Successfully!</h3>
          <div className="issue-details">
            <p><strong>Title:</strong> {createdIssue.title}</p>
            <p><strong>Status:</strong> {createdIssue.status}</p>
            <p><strong>Priority:</strong> {createdIssue.priority}</p>
            {createdIssue.owner && <p><strong>Assigned to:</strong> {createdIssue.owner}</p>}
          </div>
          <button 
            className="view-project-btn"
            onClick={() => goToProject(createdIssue.projectId)}
          >
            View in Project
          </button>
        </div>
      )}

      <style jsx>{`
        .ai-intent-demo {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #1a73e8;
          margin-bottom: 16px;
        }
        
        .description {
          font-size: 16px;
          margin-bottom: 12px;
        }
        
        .examples {
          background-color: #f1f3f4;
          padding: 16px 24px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .examples li {
          margin-bottom: 8px;
        }
        
        .demo-container {
          margin-bottom: 24px;
        }
        
        .success-panel {
          background-color: #e6f4ea;
          border: 1px solid #34a853;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }
        
        .success-panel h3 {
          color: #137333;
          margin-top: 0;
        }
        
        .issue-details {
          background-color: white;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .issue-details p {
          margin: 8px 0;
        }
        
        .view-project-btn {
          background-color: #1a73e8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 16px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .view-project-btn:hover {
          background-color: #1765cc;
        }
      `}</style>
    </div>
  );
};

export default AIIntentDemo;
