import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Variables } from "./types/hono";

export { TaskManagerAgent } from "./TaskManagerAgent";
export { TaskManagerAgent2 } from "./TaskManagerAgent2";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());

app.post("/query", async (c) => {
  const { agentId, prompt, type } = await c.req.json<{
    agentId: string;
    prompt: string;
    type: "TaskManagerAgent" | "TaskManagerAgent2";
  }>();

  console.log("agentId", agentId);
  console.log("prompt", prompt);
  console.log("type", type);

  let agentClass;
  if (type === "TaskManagerAgent") {
    agentClass = c.env.TASK_MANAGER_AGENT;
  } else if (type === "TaskManagerAgent2") {
    agentClass = c.env.TASK_MANAGER_AGENT2;
  }

  if (!agentClass) {
    return c.json({ error: "Invalid agent type specified." }, 400);
  }

  const id = agentClass.idFromName(agentId);
  const agent = agentClass.get(id);

  const result = await agent.query(prompt);
  return c.json(result);
});

app.post("/confirmations/:confirmationId", async (c) => {
  const { agentId, confirm, type } = await c.req.json<{
    agentId: string;
    confirm: boolean;
    type: "TaskManagerAgent" | "TaskManagerAgent2";
  }>();

  let agentClass;
  if (type === "TaskManagerAgent") {
    agentClass = c.env.TASK_MANAGER_AGENT;
  } else if (type === "TaskManagerAgent2") {
    agentClass = c.env.TASK_MANAGER_AGENT2;
  }

  if (!agentClass) {
    return c.json({ error: "Invalid agent type specified." }, 400);
  }

  const confirmationId = c.req.param("confirmationId");
  const id = agentClass.idFromName(agentId);
  const agent = agentClass.get(id);

  const result = await agent.confirm(confirmationId, confirm);
  return c.json(result);
});

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
