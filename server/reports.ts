import { Project, Milestone, Subtask, Issue } from '@shared/schema';
import { storage } from './storage';
import { db } from './db';
import { format } from 'date-fns';
import { generateWeeklySummary } from './ai';
import 'dotenv/config';

// Brevo (Sendinblue) integration for email sending
// This requires the EMAIL_API to be set in environment variables
import SibApiV3Sdk from 'sib-api-v3-sdk';

let brevoClient: typeof SibApiV3Sdk.ApiClient.instance | null = null;
let emailCampaignsApi: SibApiV3Sdk.EmailCampaignsApi | null = null;
if (process.env.EMAIL_API) {
  brevoClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = brevoClient.authentications['api-key'];
  apiKey.apiKey = process.env.EMAIL_API;
  emailCampaignsApi = new SibApiV3Sdk.EmailCampaignsApi();
}

interface ReportOptions {
  projectId: number;
  reportDate: string;
  reportType: 'weekly' | 'milestone' | 'status';
  recipients: string[];
}

export async function generateAndSendReport(options: ReportOptions): Promise<{ success: boolean; message: string }> {
  try {
    // Verify Brevo EMAIL_API key is set
    if (!process.env.EMAIL_API) {
      return {
        success: false,
        message: 'Brevo EMAIL_API key is not configured. Please set EMAIL_API in environment variables.'
      };
    }

    // Get project data
    const project = await storage.getProject(options.projectId);
    if (!project) {
      return {
        success: false,
        message: `Project with ID ${options.projectId} not found.`
      };
    }

    // Get milestones
    const milestones = await storage.getMilestones(options.projectId);
    
    // Get issues
    const issues = await storage.getIssues(options.projectId);
    
    // Get updates
    const updates = await storage.getUpdates(options.projectId);
    
    // Generate report content based on report type
    let subject = '';
    let htmlContent = '';
    let textContent = '';
    
    switch (options.reportType) {
      case 'weekly':
        subject = `Weekly Status Report: ${project.name} - ${format(new Date(options.reportDate), 'MMM d, yyyy')}`;
        
        // Use AI to generate a weekly summary if OpenAI API key is set
        if (process.env.OPENAI_API_KEY) {
          const summary = await generateWeeklySummary(project, {
            milestones,
            issues,
            updates,
            reportDate: options.reportDate
          });
          
          htmlContent = generateWeeklyReportHtml(project, milestones, issues, updates, summary);
          textContent = generateWeeklyReportText(project, milestones, issues, updates, summary);
        } else {
          // Generate a standard report without AI assistance
          htmlContent = generateWeeklyReportHtml(project, milestones, issues, updates);
          textContent = generateWeeklyReportText(project, milestones, issues, updates);
        }
        break;
        
      case 'milestone':
        subject = `Milestone Status Report: ${project.name} - ${format(new Date(options.reportDate), 'MMM d, yyyy')}`;
        htmlContent = generateMilestoneReportHtml(project, milestones);
        textContent = generateMilestoneReportText(project, milestones);
        break;
        
      case 'status':
        subject = `Project Status Summary: ${project.name} - ${format(new Date(options.reportDate), 'MMM d, yyyy')}`;
        htmlContent = generateStatusReportHtml(project, milestones, issues);
        textContent = generateStatusReportText(project, milestones, issues);
        break;
    }
    
    // Send the email using Brevo TransactionalEmailsApi
    if (!process.env.EMAIL_API) {
      return {
        success: false,
        message: 'Brevo EMAIL_API key is not configured. Please set EMAIL_API in environment variables.'
      };
    }

    const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: 'Project Tracker', email: 'swapnilbelote70@gmail.com' };
    sendSmtpEmail.to = options.recipients.map(email => ({ email }));

    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      message: `Report successfully sent to ${options.recipients.length} recipient(s).`
    };
  } catch (error) {
    console.error('Error generating and sending report:', error);
    return {
      success: false,
      message: `Error sending report: ${error.message || 'Unknown error'}`
    };
  }
}

// Helper function to generate HTML weekly report
function generateWeeklyReportHtml(
  project: Project, 
  milestones: Milestone[], 
  issues: Issue[], 
  updates: any[],
  aiSummary?: string
): string {
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'In Progress').length;
  const totalMilestones = milestones.length;
  const completionPercentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;
    
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;
  const highPriorityIssues = issues.filter(i => i.priority === 'High' && i.status !== 'Resolved').length;
  
  // Get the most recent updates (max 5)
  const recentUpdates = updates
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; color: #333; }
        .header p { margin: 5px 0 0; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
        .progress-container { background-color: #f5f5f5; height: 20px; border-radius: 10px; margin-bottom: 10px; }
        .progress-bar { background-color: #4CAF50; height: 20px; border-radius: 10px; text-align: center; color: white; line-height: 20px; }
        .stats { display: flex; margin-bottom: 20px; }
        .stat-box { flex: 1; background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-right: 10px; text-align: center; }
        .stat-box:last-child { margin-right: 0; }
        .stat-box h3 { margin: 0 0 5px; font-size: 14px; color: #666; }
        .stat-box p { margin: 0; font-size: 22px; font-weight: bold; color: #333; }
        .milestone-table { width: 100%; border-collapse: collapse; }
        .milestone-table th { text-align: left; padding: 10px; background-color: #f5f5f5; }
        .milestone-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .issues-list { padding-left: 20px; }
        .issues-list li { margin-bottom: 5px; }
        .high { color: #d9534f; }
        .medium { color: #f0ad4e; }
        .low { color: #5bc0de; }
        .updates-list { padding-left: 0; list-style-type: none; }
        .updates-list li { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .update-meta { font-size: 12px; color: #888; }
        .summary-section { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Status Report: ${project.name}</h1>
          <p>Report generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        
        ${aiSummary ? `
        <div class="summary-section">
          <h2>Executive Summary</h2>
          <p>${aiSummary}</p>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>Project Overview</h2>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Progress:</strong> ${project.progress}%</p>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${project.progress}%">${project.progress}%</div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Milestones</h3>
              <p>${completedMilestones}/${totalMilestones}</p>
            </div>
            <div class="stat-box">
              <h3>Completion</h3>
              <p>${completionPercentage}%</p>
            </div>
            <div class="stat-box">
              <h3>Open Issues</h3>
              <p>${openIssues}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Milestone Status</h2>
          <table class="milestone-table">
            <tr>
              <th>Milestone</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Target Date</th>
            </tr>
            ${milestones.map(m => `
              <tr>
                <td>${m.name}</td>
                <td>${m.status}</td>
                <td>${m.owner || 'Not assigned'}</td>
                <td>${m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : 'Not set'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        ${highPriorityIssues > 0 ? `
        <div class="section">
          <h2>High Priority Issues</h2>
          <ul class="issues-list">
            ${issues
              .filter(i => i.priority === 'High' && i.status !== 'Resolved')
              .map(i => `
                <li>
                  <strong>${i.title}</strong> - ${i.status}<br>
                  <span class="high">Priority: High</span><br>
                  ${i.description || ''}
                </li>
              `).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${recentUpdates.length > 0 ? `
        <div class="section">
          <h2>Recent Updates</h2>
          <ul class="updates-list">
            ${recentUpdates.map(u => `
              <li>
                <div>${u.content}</div>
                <div class="update-meta">Posted by ${u.createdBy || 'System'} on ${format(new Date(u.createdAt), 'MMM d, yyyy')}</div>
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>Next Steps</h2>
          <p>The team will focus on the following priorities for the upcoming week:</p>
          <ul>
            ${milestones
              .filter(m => m.status === 'In Progress')
              .slice(0, 3)
              .map(m => `<li>Advance work on ${m.name}</li>`)
              .join('')}
            ${highPriorityIssues > 0 ? `<li>Address ${highPriorityIssues} high priority issues</li>` : ''}
          </ul>
        </div>
        
        <div style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
          <p>This is an automated report generated by Project Tracking Assistant.<br>
          Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate plain text weekly report
function generateWeeklyReportText(
  project: Project, 
  milestones: Milestone[], 
  issues: Issue[], 
  updates: any[],
  aiSummary?: string
): string {
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const completionPercentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;
    
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;
  const highPriorityIssues = issues.filter(i => i.priority === 'High' && i.status !== 'Resolved').length;
  
  // Get the most recent updates (max 5)
  const recentUpdates = updates
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  let text = [
    `WEEKLY STATUS REPORT: ${project.name}`,
    `Report generated on ${format(new Date(), 'MMMM d, yyyy')}`,
    '',
  ];
  
  if (aiSummary) {
    text.push(
      'EXECUTIVE SUMMARY',
      '==================',
      aiSummary,
      ''
    );
  }
  
  text = [
    ...text,
    'PROJECT OVERVIEW',
    '===============',
    `Status: ${project.status}`,
    `Progress: ${project.progress}%`,
    `Milestones: ${completedMilestones}/${totalMilestones} (${completionPercentage}% complete)`,
    `Open Issues: ${openIssues}`,
    '',
    'MILESTONE STATUS',
    '===============',
  ];
  
  milestones.forEach(m => {
    text.push(
      `* ${m.name}`,
      `  Status: ${m.status}`,
      `  Owner: ${m.owner || 'Not assigned'}`,
      `  Target Date: ${m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : 'Not set'}`,
      ''
    );
  });
  
  if (highPriorityIssues > 0) {
    text.push(
      'HIGH PRIORITY ISSUES',
      '==================='
    );
    
    issues
      .filter(i => i.priority === 'High' && i.status !== 'Resolved')
      .forEach(i => {
        text.push(
          `* ${i.title} - ${i.status}`,
          `  Priority: High`,
          `  ${i.description || ''}`,
          ''
        );
      });
    
    text.push('');
  }
  
  if (recentUpdates.length > 0) {
    text.push(
      'RECENT UPDATES',
      '==============',
      ''
    );
    
    recentUpdates.forEach(u => {
      text.push(
        `* ${u.content}`,
        `  Posted by ${u.createdBy || 'System'} on ${format(new Date(u.createdAt), 'MMM d, yyyy')}`,
        ''
      );
    });
  }
  
  text.push(
    'NEXT STEPS',
    '==========',
    'The team will focus on the following priorities for the upcoming week:',
    ''
  );
  
  milestones
    .filter(m => m.status === 'In Progress')
    .slice(0, 3)
    .forEach(m => {
      text.push(`* Advance work on ${m.name}`);
    });
  
  if (highPriorityIssues > 0) {
    text.push(`* Address ${highPriorityIssues} high priority issues`);
  }
  
  text.push(
    '',
    '',
    'This is an automated report generated by Project Tracking Assistant.',
    'Please do not reply directly to this email.'
  );
  
  return text.join('\n');
}

// Helper function to generate HTML milestone report
function generateMilestoneReportHtml(project: Project, milestones: Milestone[]): string {
  // Implementation similar to weekly report but focused on milestones
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; color: #333; }
        .header p { margin: 5px 0 0; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
        .milestone-table { width: 100%; border-collapse: collapse; }
        .milestone-table th { text-align: left; padding: 10px; background-color: #f5f5f5; }
        .milestone-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .not-started { color: #6c757d; }
        .in-progress { color: #007bff; }
        .completed { color: #28a745; }
        .at-risk { color: #dc3545; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Milestone Status Report: ${project.name}</h1>
          <p>Report generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        
        <div class="section">
          <h2>Milestone Status Overview</h2>
          <table class="milestone-table">
            <tr>
              <th>Milestone</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Target Date</th>
              <th>Owner</th>
            </tr>
            ${milestones.map(m => `
              <tr>
                <td>${m.name}</td>
                <td class="${m.status.toLowerCase().replace(/\s+/g, '-')}">${m.status}</td>
                <td>${m.startDate ? format(new Date(m.startDate), 'MMM d, yyyy') : 'Not set'}</td>
                <td>${m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : 'Not set'}</td>
                <td>${m.owner || 'Not assigned'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
          <p>This is an automated report generated by Project Tracking Assistant.<br>
          Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate plain text milestone report
function generateMilestoneReportText(project: Project, milestones: Milestone[]): string {
  let text = [
    `MILESTONE STATUS REPORT: ${project.name}`,
    `Report generated on ${format(new Date(), 'MMMM d, yyyy')}`,
    '',
    'MILESTONE STATUS OVERVIEW',
    '========================',
    ''
  ];
  
  milestones.forEach(m => {
    text.push(
      `* ${m.name}`,
      `  Status: ${m.status}`,
      `  Start Date: ${m.startDate ? format(new Date(m.startDate), 'MMM d, yyyy') : 'Not set'}`,
      `  Target Date: ${m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : 'Not set'}`,
      `  Owner: ${m.owner || 'Not assigned'}`,
      ''
    );
  });
  
  text.push(
    '',
    'This is an automated report generated by Project Tracking Assistant.',
    'Please do not reply directly to this email.'
  );
  
  return text.join('\n');
}

// Helper function to generate HTML status report
function generateStatusReportHtml(project: Project, milestones: Milestone[], issues: Issue[]): string {
  // Implementation similar to weekly report but focused on overall status
  const notStarted = milestones.filter(m => m.status === 'Not Started').length;
  const inProgress = milestones.filter(m => m.status === 'In Progress').length;
  const completed = milestones.filter(m => m.status === 'Completed').length;
  const atRisk = milestones.filter(m => m.status === 'At Risk').length;
  
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; color: #333; }
        .header p { margin: 5px 0 0; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
        .progress-container { background-color: #f5f5f5; height: 20px; border-radius: 10px; margin-bottom: 10px; }
        .progress-bar { background-color: #4CAF50; height: 20px; border-radius: 10px; text-align: center; color: white; line-height: 20px; }
        .stats { display: flex; margin-bottom: 20px; }
        .stat-box { flex: 1; background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-right: 10px; text-align: center; }
        .stat-box:last-child { margin-right: 0; }
        .stat-box h3 { margin: 0 0 5px; font-size: 14px; color: #666; }
        .stat-box p { margin: 0; font-size: 22px; font-weight: bold; color: #333; }
        .chart-container { display: flex; margin-bottom: 20px; }
        .chart-bar { flex: 1; margin-right: 10px; text-align: center; }
        .chart-bar:last-child { margin-right: 0; }
        .bar { margin: 0 auto; width: 40px; }
        .not-started-bar { background-color: #6c757d; }
        .in-progress-bar { background-color: #007bff; }
        .completed-bar { background-color: #28a745; }
        .at-risk-bar { background-color: #dc3545; }
        .chart-bar p { margin: 5px 0 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Project Status Summary: ${project.name}</h1>
          <p>Report generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        
        <div class="section">
          <h2>Project Overview</h2>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Progress:</strong> ${project.progress}%</p>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${project.progress}%">${project.progress}%</div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Start Date</h3>
              <p>${project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}</p>
            </div>
            <div class="stat-box">
              <h3>End Date</h3>
              <p>${project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Not set'}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Milestone Status</h2>
          
          <div class="chart-container">
            <div class="chart-bar">
              <div class="bar not-started-bar" style="height: ${notStarted * 20}px;"></div>
              <p>${notStarted}<br>Not Started</p>
            </div>
            <div class="chart-bar">
              <div class="bar in-progress-bar" style="height: ${inProgress * 20}px;"></div>
              <p>${inProgress}<br>In Progress</p>
            </div>
            <div class="chart-bar">
              <div class="bar completed-bar" style="height: ${completed * 20}px;"></div>
              <p>${completed}<br>Completed</p>
            </div>
            <div class="chart-bar">
              <div class="bar at-risk-bar" style="height: ${atRisk * 20}px;"></div>
              <p>${atRisk}<br>At Risk</p>
            </div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Total Milestones</h3>
              <p>${milestones.length}</p>
            </div>
            <div class="stat-box">
              <h3>Completion</h3>
              <p>${milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0}%</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Issues Status</h2>
          
          <div class="stats">
            <div class="stat-box">
              <h3>Open Issues</h3>
              <p>${openIssues}</p>
            </div>
            <div class="stat-box">
              <h3>Resolved Issues</h3>
              <p>${resolvedIssues}</p>
            </div>
            <div class="stat-box">
              <h3>Total Issues</h3>
              <p>${issues.length}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
          <p>This is an automated report generated by Project Tracking Assistant.<br>
          Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate plain text status report
function generateStatusReportText(project: Project, milestones: Milestone[], issues: Issue[]): string {
  const notStarted = milestones.filter(m => m.status === 'Not Started').length;
  const inProgress = milestones.filter(m => m.status === 'In Progress').length;
  const completed = milestones.filter(m => m.status === 'Completed').length;
  const atRisk = milestones.filter(m => m.status === 'At Risk').length;
  
  const openIssues = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;
  
  const completionPercentage = milestones.length > 0 
    ? Math.round((completed / milestones.length) * 100) 
    : 0;
  
  let text = [
    `PROJECT STATUS SUMMARY: ${project.name}`,
    `Report generated on ${format(new Date(), 'MMMM d, yyyy')}`,
    '',
    'PROJECT OVERVIEW',
    '===============',
    `Status: ${project.status}`,
    `Progress: ${project.progress}%`,
    `Start Date: ${project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}`,
    `End Date: ${project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Not set'}`,
    '',
    'MILESTONE STATUS',
    '===============',
    `Not Started: ${notStarted}`,
    `In Progress: ${inProgress}`,
    `Completed: ${completed}`,
    `At Risk: ${atRisk}`,
    `Total Milestones: ${milestones.length}`,
    `Completion: ${completionPercentage}%`,
    '',
    'ISSUES STATUS',
    '============',
    `Open Issues: ${openIssues}`,
    `Resolved Issues: ${resolvedIssues}`,
    `Total Issues: ${issues.length}`,
    '',
    '',
    'This is an automated report generated by Project Tracking Assistant.',
    'Please do not reply directly to this email.'
  ];
  
  return text.join('\n');
}