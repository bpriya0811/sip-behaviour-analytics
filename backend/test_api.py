#!/usr/bin/env python
"""Test API endpoints to verify the system is working"""
import time
import json
import urllib.request
import urllib.error

time.sleep(2)  # Wait for server to be ready

BASE_URL = "http://127.0.0.1:8000/api"

print("\n=== API ENDPOINT TESTS ===\n")

# Test 1: Geography endpoint
print("1. Testing /geography/options/")
try:
    with urllib.request.urlopen(f"{BASE_URL}/geography/options/") as r:
        data = json.loads(r.read().decode())
        print(f"   ✓ Status: {r.status}")
        print(f"   ✓ Districts: {len(data.get('districts', []))}")
        print(f"   ✓ Sample districts: {data.get('districts', [])[:2]}")
        kolhapur_count = len(data.get('talukasByDistrict', {}).get('Kolhapur', []))
        print(f"   ✓ Kolhapur talukas: {kolhapur_count}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Questions endpoint
print("\n2. Testing /questions/")
try:
    with urllib.request.urlopen(f"{BASE_URL}/questions/") as r:
        data = json.loads(r.read().decode())
        print(f"   ✓ Status: {r.status}")
        print(f"   ✓ Questions: {len(data)}")
        if data:
            print(f"   ✓ First question: {data[0].get('prompt', '')[:50]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: Analytics endpoint
print("\n3. Testing /analytics/summary/")
try:
    with urllib.request.urlopen(f"{BASE_URL}/analytics/summary/") as r:
        data = json.loads(r.read().decode())
        print(f"   ✓ Status: {r.status}")
        print(f"   ✓ Total respondents: {data.get('overview', {}).get('totalRespondents', 0)}")
        print(f"   ✓ Average SIP: {data.get('overview', {}).get('averageSipAmount', 0)}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n✓ API test complete\n")
