import requests
import sys
import json

# Generate a random string for the file name, or replace this with a specific string for testing.
def fct_random_string():
    import random
    import string
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))

# Setup the file data and headers
file_data = {
    'name': fct_random_string(),
    'type': 'folder',
}
headers = {
    'X-Token': f'{sys.argv[1]}',  # Replace this with your actual token
}

# Perform the POST request
response = requests.post('http://localhost:5000/files', json=file_data, headers=headers)

# Print out the request details for debugging
print("Request URL:", response.request.url)
print("Request Headers:", response.request.headers)
print("Request Body:", response.request.body)

# Print out the response details
print("Response Status Code:", response.status_code)
print("Response Headers:", response.headers)
print("Response Body:", json.dumps(response.json(), indent=2))

