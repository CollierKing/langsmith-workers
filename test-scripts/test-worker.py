import requests

url = "http://localhost:8787/query"

r = requests.post(url, json={"agentId": "test-user-123", "prompt": "Add a task to get the mail"})
print(r.content)

# r = requests.post(url, json={"agentId": "test-user-123", "prompt": "List all my tasks"})
#
# r
# print(r.content)