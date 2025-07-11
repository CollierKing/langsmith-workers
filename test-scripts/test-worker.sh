curl -X POST http://localhost:8787/query \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-user-123", "prompt": "Add a task to buy groceries"}'

curl -X POST http://localhost:8787/query \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-user-123", "prompt": "Delete the task about buying groceries"}'

  curl -X POST http://localhost:8787/query \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-user-123", "prompt": "Show me all my tasks"}'