import requests, json, sys
url='http://127.0.0.1:8000/api/games/cryptarith/new'
payload={'equation':'SEND + MORE = MONEY'}
resp=requests.post(url,json=payload)
print('Status', resp.status_code)
print('Response', resp.json())
