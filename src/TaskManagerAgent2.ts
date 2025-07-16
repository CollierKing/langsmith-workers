import { Agent } from "agents";
import { generateText, Tool } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { Client } from "langsmith";
import { traceable } from "langsmith/traceable";
import { Task, Confirmation, TaskManagerState, Creds } from "./ts/types";
import { createTools } from "./tools";

// MARK: - CONSTANTS
const LANGSMITH_PROJECT = "cloudflare-agents";
const SYSTEM_PROMPT =
  "You are a task manager. Your primary function is to use the provided tools to add, delete, or list tasks. Only respond with text if no tool is applicable or if you are asked a general question.";
const TRACEABLE_NAME = "traceable-test2";
const MODEL_NAME = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// MARK: - AGENT
export class TaskManagerAgent2 extends Agent<
  { AI: Ai } & Creds,
  TaskManagerState
> {
  private client: Client;
  private aiModel: any;
  private traceableGenerateText: any;
  private tools: Record<string, Tool<any, any>>;

  constructor(state: DurableObjectState, env: { AI: Ai } & Creds) {
    super(state, env);
    this.client = new Client({
      apiUrl: this.env.LANGSMITH_ENDPOINT2,
      apiKey: this.env.LANGSMITH_API_KEY2,
    });

    const workersai = createWorkersAI({ binding: this.env.AI });

    // @ts-ignore
    this.aiModel = workersai(MODEL_NAME);

    this.traceableGenerateText = traceable(generateText, {
      name: TRACEABLE_NAME,
      client: this.client,
      project_name: LANGSMITH_PROJECT,
      tracingEnabled: true,
      run_type: "llm",
    });

    this.tools = createTools(this);
  }

  /**
   * The initial state of the TaskManagerAgent. By default, there are no tasks and no confirmations.
   */
  initialState: TaskManagerState = {
    tasks: [],
    confirmations: [],
  };

  /**
   * MARK: - QUERY
   * Processes a user query and decides whether to add a task, delete a task, list tasks,
   * or do nothing. Instead of immediately performing add/delete, it creates a Confirmation.
   */
  async query(
    query: string,
  ): Promise<
    | { confirmation?: Confirmation; message?: string }
    | Task[]
    | string
    | undefined
  > {
    const { text, toolResults }: { text: string; toolResults?: any[] } =
      await this.traceableGenerateText({
        model: this.aiModel,
        system: SYSTEM_PROMPT,
        prompt: query,
        tools: this.tools,
      });

    if (toolResults && toolResults.length > 0) {
      for (const toolResult of toolResults) {
        switch (toolResult.toolName) {
          case "listTasks": {
            return toolResult.result;
          }
          case "addTask": {
            return toolResult.result;
          }
          case "deleteTask": {
            return toolResult.result;
          }
          default:
            // Should not happen, but satisfies TypeScript
            break;
        }
      }
    }

    return text;
  }

  /**
   * MARK: - CONFIRM
   * Called by the user (through some external route) to confirm a pending action.
   * If userConfirmed is true, the action is applied. If false, the confirmation is dropped.
   *
   * @param confirmationId - The ID of the Confirmation to confirm or cancel.
   * @param userConfirmed - Whether to proceed with the action (`true`) or reject it (`false`).
   * @returns The result of the action that was confirmed, or a message if rejected/not found.
   */
  async confirm(
    confirmationId: string,
    userConfirmed: boolean,
  ): Promise<Task | string | false | undefined> {
    console.log(
      "State at start of confirm method:",
      JSON.stringify(this.state, null, 2),
    );
    // Find the confirmation in the state.
    const confirmation = this.state.confirmations.find(
      (c) => c.id === confirmationId,
    );

    if (!confirmation) {
      return "No matching confirmation found.";
    }

    let result: Task | string | false | undefined;

    // If the user actually wants to do the action:
    if (userConfirmed) {
      if (confirmation.action === "add" && confirmation.task) {
        // Replay the add operation.
        result = await this.addTask(
          confirmation.task.title,
          confirmation.task.description,
        );
      } else if (confirmation.action === "delete" && confirmation.taskId) {
        // Replay the delete operation.
        result = await this.deleteTask(confirmation.taskId);
      }
    } else {
      // If user chose not to confirm, simply store a message or handle as needed.
      result = "User chose not to proceed with this action.";
    }

    // Remove the used (or rejected) confirmation from the array.
    const remainingConfirmations = this.state.confirmations.filter(
      (c) => c.id !== confirmationId,
    );

    this.setState({
      ...this.state,
      confirmations: remainingConfirmations,
    });

    return result;
  }

  // MARK: - TOOLS

  /**
   * MARK: - ADD TASK
   * Actually adds the task (used internally or upon human confirmation).
   */
  async addTask(title: string, description?: string): Promise<Task> {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      completed: false,
      createdAt: Date.now(),
    };

    this.setState({
      ...this.state,
      tasks: [...this.state.tasks, newTask],
    });

    return newTask;
  }

  /**
   * MARK: - LIST TASKS
   * Returns the current list of tasks in the agent's state.
   */
  listTasks(): Task[] {
    return this.state.tasks;
  }

  /**
   * MARK: - DELETE TASK
   * Actually deletes the task (used internally or upon human confirmation).
   * @param taskId - The ID of the task to delete.
   */
  async deleteTask(taskId: string): Promise<string | false> {
    const initialLength = this.state.tasks.length;
    const filteredTasks = this.state.tasks.filter((task) => task.id !== taskId);

    if (initialLength === filteredTasks.length) {
      // No task removed, so it was not found.
      return false;
    }

    this.setState({
      ...this.state,
      tasks: filteredTasks,
    });

    return taskId;
  }

  /**
   * Triggered any time the state is updated. Logs a diagnostic message.
   */
  onStateUpdate(state: TaskManagerState): void {
    console.log("Task manager state updated:", state);
  }
}
