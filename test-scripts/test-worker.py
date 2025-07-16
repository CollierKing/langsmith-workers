from pprint import pprint
import requests

url = "http://localhost:8787"
agent_type = "TaskManagerAgent2"

# Add Task
r = \
    requests.post(f"{url}/query", json={
        "agentId": "test-user-123",
        "prompt": "Add a task to get the ice cream",
        "type": agent_type
    })
print(r.content)

confirmation_id = r.json()['confirmation']['id']

# '9472b694-0a49-4567-81ee-64ae98d8eab9'

# Confirm Task
r = \
    requests.post(f"{url}/confirmations/{confirmation_id}", json={
        "agentId": "test-user-123",
        "confirm": True,
        "type": agent_type
    })
print(r.content)

# List Tasks
r = requests.post(f"{url}/query", json={
    "agentId": "test-user-123",
    "prompt": "List all my tasks",
    "type": agent_type
})

pprint(r.json())

# todo: delete task
