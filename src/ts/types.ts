/**
 * Represents a single task within the system.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
}

/**
 * Represents a confirmation object that waits for human approval
 * before the requested action is actually taken.
 */
export interface Confirmation {
  id: string;
  action: "add" | "delete";
  /** Only used for "add" actions. */
  task?: Task;
  /** Only used for "delete" actions. */
  taskId?: string;
}

/**
 * Represents the agent's state, including tasks and pending confirmations.
 */
export interface TaskManagerState {
  tasks: Task[];
  confirmations: Confirmation[];
}

/**
 * Represents the function details for a tool call.
 */
export interface ToolCallFunction {
  name: string;
  arguments: string;
}

/**
 * Represents a tool call made by the assistant.
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: ToolCallFunction;
}

/**
 * Represents a message from the assistant, including tool calls.
 */
export interface AssistantMessage {
  role: "assistant";
  content: string; // JSON stringified actionObject
  tool_calls?: ToolCall[];
}

/**
 * Represents the response structure from the wrapped traceable function.
 */
export interface WrappedTextResponse {
  messages: AssistantMessage[];
}

/**
 * Represents the response for getting a task title.
 */
export interface GetTitleResponse {
  title?: string;
}

/**
 * Represents the response for getting a task ID.
 */
export interface GetTaskIdResponse {
  taskId?: string;
}

export type Creds = {
  LANGSMITH_ENDPOINT2: string;
  LANGSMITH_API_KEY2: string;
};
