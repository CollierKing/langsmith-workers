import { tool, Tool } from "ai";
import z from "zod";
import { Confirmation } from "./ts/types";
import { TaskManagerAgent2 } from "./TaskManagerAgent2";

export const createTools = (
  agent: TaskManagerAgent2,
): Record<string, Tool<any, any>> => ({
  listTasks: tool({
    description: "List the current tasks.",
    parameters: z.object({}),
    execute: async () => agent.listTasks(),
  }),
  addTask: tool({
    description: "Add a task to the list.",
    parameters: z.object({
      title: z.string().describe("The title of the task."),
      description: z
        .string()
        .describe("The description of the task.")
        .optional(),
    }),
    execute: async ({ title, description }) => {
      const newConfirmation: Confirmation = {
        id: crypto.randomUUID(),
        action: "add",
        task: {
          id: crypto.randomUUID(),
          title: title,
          description: description,
          completed: false,
          createdAt: Date.now(),
        },
      };
      agent.setState({
        ...agent.state,
        confirmations: [...agent.state.confirmations, newConfirmation],
      });
      return { confirmation: newConfirmation };
    },
  }),
  deleteTask: tool({
    description: "Delete a task from the list.",
    parameters: z.object({
      taskId: z.string().describe("The ID of the task to delete."),
    }),
    execute: async ({ taskId }) => {
      const newConfirmation: Confirmation = {
        id: crypto.randomUUID(),
        action: "delete",
        taskId: taskId,
      };
      agent.setState({
        ...agent.state,
        confirmations: [...agent.state.confirmations, newConfirmation],
      });
      return { confirmation: newConfirmation };
    },
  }),
});
