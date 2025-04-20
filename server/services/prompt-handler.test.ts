import { PromptHandler } from './prompt-handler';
import { DatabaseStorage } from '../database-storage';
import { addDays } from 'date-fns';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            type: 'subtask',
            name: 'Test Task',
            milestoneId: 1,
            owner: null,
            endDate: null
          })
        }
      }
    ]
  });

  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Mock DatabaseStorage
const mockStorage = {
  createIssue: jest.fn(),
  createSubtask: jest.fn(),
  getProjectStatus: jest.fn(),
  getProjectUpdates: jest.fn(),
  getProjectIssues: jest.fn(),
  getMilestones: jest.fn() as jest.MockedFunction<() => Promise<any>>,
  getProject: jest.fn(),
  getUpdates: jest.fn(),
  getIssues: jest.fn()
} as unknown as DatabaseStorage;

describe('PromptHandler', () => {
  let handler: PromptHandler;

  beforeEach(() => {
    handler = new PromptHandler(mockStorage);
    jest.clearAllMocks();
  });

  describe('Subtask Creation', () => {
    beforeEach(() => {
      (mockStorage.getMilestones as jest.MockedFunction<any>).mockResolvedValue([
        { id: 1, name: 'Configuration' },
        { id: 2, name: 'UAT' }
      ]);
    });

    it('should handle subtask creation with full details', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'subtask',
                name: 'DB Design Review',
                milestoneId: 1,
                owner: 'Balak P',
                endDate: addDays(new Date(), 4).toISOString().split('T')[0]
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = 'Add a subtask in Configuration: name the subtask as DB Design Review and assign Balak P for 4 days';
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.createSubtask).toHaveBeenCalledWith({
        name: 'DB Design Review',
        owner: 'Balak P',
        endDate: expect.any(String),
        milestoneId: 1,
        status: 'Not Started',
        order: 1,
        description: null,
        emailToSend: null,
        startDate: null
      });
    });

    it('should handle subtask creation with minimal details', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'subtask',
                name: 'Test Task',
                milestoneId: 1,
                owner: null,
                endDate: null
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = 'Add a subtask Test Task in Configuration';
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.createSubtask).toHaveBeenCalledWith({
        name: 'Test Task',
        milestoneId: 1,
        status: 'Not Started',
        order: 1,
        description: null,
        owner: null,
        endDate: null,
        emailToSend: null,
        startDate: null
      });
    });

    it('should throw error for invalid milestone', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'subtask',
                name: 'Test Task',
                milestoneId: 999, // Invalid milestone ID
                owner: null,
                endDate: null
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = 'Add a subtask Test Task in InvalidPhase';
      const projectId = 1;

      await expect(handler.handlePrompt(prompt, projectId))
        .rejects
        .toThrow('Milestone with ID 999 not found');
    });
  });

  describe('Issue Creation', () => {
    beforeEach(() => {
      (mockStorage.getMilestones as jest.MockedFunction<any>).mockResolvedValue([
        { id: 1, name: 'Configuration' }
      ]);
    });

    it('should create issue for delay', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'issue',
                title: 'The ABC project is delayed by 2 days due to delay from CPI team',
                description: 'The ABC project is delayed by 2 days due to delay from CPI team. Configuration may be delayed.',
                priority: 'Medium'
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = 'The ABC project is delayed by 2 days due to delay from CPI team. Configuration may be delayed.';
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.createIssue).toHaveBeenCalledWith({
        title: 'The ABC project is delayed by 2 days due to delay from CPI team',
        description: prompt,
        status: 'Open',
        priority: 'Medium',
        projectId,
        owner: null,
        reportedBy: 'AI Assistant'
      });
    });
  });

  describe('Queries', () => {
    it('should handle status query', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'query',
                queryType: 'status'
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = "What's the current project status?";
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.getProjectStatus).toHaveBeenCalledWith(projectId);
    });

    it('should handle updates query', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'query',
                queryType: 'updates'
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = "Show me recent updates";
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.getProjectUpdates).toHaveBeenCalledWith(projectId);
    });

    it('should handle issues query', async () => {
      // Mock OpenAI response for this test
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                type: 'query',
                queryType: 'issues'
              })
            }
          }
        ]
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).prototype.chat = {
        completions: {
          create: mockCreate
        }
      };

      const prompt = "List all issues";
      const projectId = 1;

      await handler.handlePrompt(prompt, projectId);

      expect(mockStorage.getProjectIssues).toHaveBeenCalledWith(projectId);
    });
  });
});
