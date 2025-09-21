#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI backend is working correctly.
Run this after starting your backend server.
"""

import requests
import json

def test_backend():
    base_url = "http://127.0.0.1:8000"
    
    print("🚀 Testing Railway Traffic Control Backend")
    print("=" * 50)
    
    # Test 1: Root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False
    
    # Test 2: AI Decisions endpoint
    try:
        response = requests.get(f"{base_url}/aidecisions")
        print(f"✅ AI Decisions endpoint: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data.get('decisions', []))} decisions")
        if data.get('decisions'):
            print(f"   Sample decision: {data['decisions'][0]['description'][:50]}...")
    except Exception as e:
        print(f"❌ AI Decisions endpoint failed: {e}")
        return False
    
    # Test 3: ML Predictions endpoint
    try:
        response = requests.get(f"{base_url}/mlpredictions")
        print(f"✅ ML Predictions endpoint: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data.get('predictions', []))} predictions")
        if data.get('predictions'):
            print(f"   Sample prediction: {data['predictions'][0]['trainId']} - {data['predictions'][0]['predictedDelay']}min delay")
    except Exception as e:
        print(f"❌ ML Predictions endpoint failed: {e}")
        return False
    
    # Test 4: Alternative predictions endpoint
    try:
        response = requests.get(f"{base_url}/predictions")
        print(f"✅ Alternative Predictions endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Alternative Predictions endpoint failed: {e}")
        return False
    
    print("\n🎉 All API endpoints are working!")
    print("\n📡 WebSocket endpoints available:")
    print("   - ws://127.0.0.1:8000/ws/trains")
    print("   - ws://127.0.0.1:8000/ws/predictions") 
    print("   - ws://127.0.0.1:8000/ws/decisions")
    
    print("\n🌐 Frontend should now work with:")
    print("   - http://localhost:8080/ai-decisions")
    print("   - http://localhost:8080/ml-predictions")
    
    return True

if __name__ == "__main__":
    test_backend()
