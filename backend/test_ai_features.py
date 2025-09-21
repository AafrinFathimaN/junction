"""
Test script for the Core AI & Optimization features
Demonstrates the ML prediction and optimization capabilities
"""

import requests
import json
from datetime import datetime

# Backend URL (adjust if running on different port)
BASE_URL = "http://localhost:8000"

def test_ml_prediction():
    """Test the ML prediction endpoint"""
    print("🧠 Testing ML Prediction Endpoint...")
    
    prediction_data = {
        "train_id": "EXP-101",
        "weather": 0.7,  # Moderate weather
        "traffic_density": 0.8,  # High traffic
        "hour": 17,  # Peak hour
        "day_of_week": 1,  # Monday
        "track_condition": 0.9,
        "signal_delay": 0.3,
        "platform_availability": 0.6,
        "route_complexity": 6,
        "train_type": "Express",
        "current_delay": 5.0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=prediction_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ ML Prediction successful!")
            print(f"   Predicted Delay: {result['prediction']['predicted_delay']} minutes")
            print(f"   Confidence: {result['prediction']['confidence']}")
            print(f"   Optimal Route: {result['prediction']['optimal_route']}")
            print(f"   Recommendation: {result['prediction']['recommendation']}")
            print(f"   Factors: {', '.join(result['prediction']['factors'])}")
        else:
            print(f"❌ ML Prediction failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ ML Prediction error: {e}")

def test_schedule_optimization():
    """Test the schedule optimization endpoint"""
    print("\n⚙️ Testing Schedule Optimization Endpoint...")
    
    optimization_data = {
        "trains": [
            {
                "id": "EXP-101",
                "route": ["A", "B", "C"],
                "priority": 2,
                "current_delay": 5
            },
            {
                "id": "LOC-78",
                "route": ["A", "D", "E"],
                "priority": 1,
                "current_delay": 0
            },
            {
                "id": "FRT-203",
                "route": ["B", "C", "F"],
                "priority": 0,
                "current_delay": 10
            }
        ],
        "tracks": [
            {"id": "A", "capacity": 1, "type": "junction"},
            {"id": "B", "capacity": 2, "type": "track"},
            {"id": "C", "capacity": 1, "type": "junction"},
            {"id": "D", "capacity": 1, "type": "track"},
            {"id": "E", "capacity": 1, "type": "platform"},
            {"id": "F", "capacity": 1, "type": "platform"}
        ],
        "current_schedule": {
            "EXP-101": {"scheduled_time": 0},
            "LOC-78": {"scheduled_time": 5},
            "FRT-203": {"scheduled_time": 10}
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/optimize", json=optimization_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Schedule Optimization successful!")
            print(f"   Optimization Method: {result['optimized_schedule']['optimization_method']}")
            print(f"   Conflicts Resolved: {result['optimized_schedule']['conflicts_resolved']}")
            print(f"   Total Delay Reduction: {result['optimized_schedule']['total_delay_reduction']}")
            print(f"   Optimization Time: {result['optimized_schedule']['optimization_time']:.3f}s")
            
            # Show optimized train schedules
            for train_id, train_data in result['optimized_schedule']['trains'].items():
                print(f"   Train {train_id}: Route {train_data['route']}")
        else:
            print(f"❌ Schedule Optimization failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Schedule Optimization error: {e}")

def test_decision_feedback():
    """Test the decision feedback endpoints"""
    print("\n🔄 Testing Decision Feedback Endpoints...")
    
    # First, get current decisions
    try:
        response = requests.get(f"{BASE_URL}/aidecisions")
        if response.status_code == 200:
            decisions = response.json()['decisions']
            if decisions:
                decision_id = decisions[0]['id']
                print(f"   Testing with decision: {decision_id}")
                
                # Test accepting a decision
                accept_data = {
                    "action": "accept",
                    "controller_id": "controller-001",
                    "feedback_score": 0.9,
                    "context": "Good decision, saved time"
                }
                
                response = requests.post(f"{BASE_URL}/decisions/{decision_id}/accept", json=accept_data)
                if response.status_code == 200:
                    print("✅ Decision acceptance recorded!")
                else:
                    print(f"❌ Decision acceptance failed: {response.status_code}")
                
                # Test getting decision history
                response = requests.get(f"{BASE_URL}/decisions/history?limit=10")
                if response.status_code == 200:
                    history = response.json()
                    print("✅ Decision history retrieved!")
                    print(f"   Total decisions: {history['stats']['total_decisions']}")
                    print(f"   Acceptance rate: {history['stats']['acceptance_rate']}")
                else:
                    print(f"❌ Decision history failed: {response.status_code}")
            else:
                print("❌ No decisions available for testing")
        else:
            print(f"❌ Failed to get decisions: {response.status_code}")
    except Exception as e:
        print(f"❌ Decision feedback error: {e}")

def test_analytics():
    """Test the analytics endpoints"""
    print("\n📊 Testing Analytics Endpoints...")
    
    try:
        response = requests.get(f"{BASE_URL}/analytics/performance")
        if response.status_code == 200:
            result = response.json()
            print("✅ Analytics retrieved!")
            print(f"   Delay Prediction Performance: {result['delay_prediction']}")
            print(f"   Overall Stats: {result['overall_stats']}")
        else:
            print(f"❌ Analytics failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Analytics error: {e}")

def main():
    """Run all tests"""
    print("🚀 Junction Genius AI & Optimization Features Test")
    print("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print("❌ Backend is not running. Please start it with: uvicorn main:app --reload")
            return
    except:
        print("❌ Backend is not running. Please start it with: uvicorn main:app --reload")
        return
    
    print("✅ Backend is running!")
    
    # Run tests
    test_ml_prediction()
    test_schedule_optimization()
    test_decision_feedback()
    test_analytics()
    
    print("\n🎉 All tests completed!")
    print("\n📋 Available Endpoints:")
    print("   POST /predict - ML delay prediction")
    print("   POST /optimize - Schedule optimization")
    print("   POST /decisions/{id}/accept - Accept decision")
    print("   POST /decisions/{id}/reject - Reject decision")
    print("   GET /decisions/history - Decision history")
    print("   GET /analytics/performance - Model performance")
    print("   POST /feedback/model - Record model feedback")

if __name__ == "__main__":
    main()
