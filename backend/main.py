# backend/main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio
import random
import json
from datetime import datetime, timedelta

# Import our custom modules
from ml_models import delay_predictor
from optimization_engine import schedule_optimizer, lns_optimizer
from decision_history import decision_history

app = FastAPI(title="Junction Genius AI Backend", version="1.0.0")

# Enable CORS (so React frontend can call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for dev
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class PredictionRequest(BaseModel):
    train_id: str
    weather: float = 0.0
    traffic_density: float = 0.0
    hour: int = 12
    day_of_week: int = 0
    track_condition: float = 1.0
    signal_delay: float = 0.0
    platform_availability: float = 1.0
    route_complexity: int = 1
    train_type: str = "Express"
    current_delay: float = 0.0

class OptimizationRequest(BaseModel):
    trains: List[Dict[str, Any]]
    tracks: List[Dict[str, Any]]
    current_schedule: Dict[str, Any]

class DecisionAction(BaseModel):
    action: str  # "accept" or "reject"
    controller_id: Optional[str] = None
    feedback_score: Optional[float] = None
    context: Optional[str] = None

# ---- Mock Data ----
ai_decisions_data = [
    {
        "id": "dec-1",
        "type": "priority",
        "description": "Allow Express 101 to pass Freight 203 at Junction A",
        "impact": "Saves 15 minutes for 342 passengers, delays freight by 5 minutes",
        "confidence": 0.89,
        "status": "pending",
        "estimatedTimeSaving": 15
    },
    {
        "id": "dec-2", 
        "type": "routing",
        "description": "Reroute Local 78 via Platform 5 due to maintenance",
        "impact": "Avoids 25-minute delay, adds 3 minutes to journey",
        "confidence": 0.94,
        "status": "accepted",
        "estimatedTimeSaving": 22
    },
    {
        "id": "dec-3",
        "type": "scheduling", 
        "description": "Hold Express 205 for 2 minutes to coordinate with Local 78",
        "impact": "Prevents platform conflict, optimizes passenger connections",
        "confidence": 0.76,
        "status": "pending",
        "estimatedTimeSaving": 8
    }
]

ml_predictions_data = [
    {
        "trainId": "EXP-101",
        "predictedDelay": 3,
        "confidence": 0.92,
        "factors": ["Weather conditions", "Traffic density"],
        "recommendation": "Maintain current schedule"
    },
    {
        "trainId": "FRT-203", 
        "predictedDelay": 18,
        "confidence": 0.87,
        "factors": ["Signal delay", "Track congestion", "Priority conflicts"],
        "recommendation": "Reroute via Loop B to reduce delay to 8 minutes"
    },
    {
        "trainId": "LOC-78",
        "predictedDelay": 35,
        "confidence": 0.95,
        "factors": ["Mechanical issue", "Platform availability"],
        "recommendation": "Emergency maintenance required - hold at current position"
    }
]


# ---- API Endpoints ----
@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/aidecisions")
def get_ai_decisions():
    return {"decisions": ai_decisions_data}

@app.get("/mlpredictions")
def get_ml_predictions():
    return {"predictions": ml_predictions_data}

# Alternative endpoint for ML predictions (in case frontend uses different path)
@app.get("/predictions")
def get_predictions():
    return {"predictions": ml_predictions_data}

# ---- Core AI & Optimization Endpoints ----

@app.post("/predict")
def predict_delay(request: PredictionRequest):
    """
    ML Prediction endpoint using Gradient Boosting model
    Returns delay prediction and routing recommendations
    """
    try:
        # Convert request to features dict
        features = {
            'weather': request.weather,
            'traffic_density': request.traffic_density,
            'hour': request.hour,
            'day_of_week': request.day_of_week,
            'track_condition': request.track_condition,
            'signal_delay': request.signal_delay,
            'platform_availability': request.platform_availability,
            'route_complexity': request.route_complexity,
            'train_type': request.train_type,
            'current_delay': request.current_delay
        }
        
        # Get prediction from ML model
        prediction = delay_predictor.predict_delay(features)
        
        # Add request metadata
        prediction['train_id'] = request.train_id
        prediction['timestamp'] = datetime.now().isoformat()
        prediction['model_version'] = '1.0'
        
        return {
            "success": True,
            "prediction": prediction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/optimize")
def optimize_schedule(request: OptimizationRequest):
    """
    Schedule Optimization endpoint using Constraint Programming
    Returns optimized schedule with reduced conflicts and delays
    """
    try:
        # Use constraint programming optimizer
        optimized_schedule = schedule_optimizer.optimize_schedule(
            trains=request.trains,
            tracks=request.tracks,
            current_schedule=request.current_schedule
        )
        
        # Apply Large Neighbourhood Search for further optimization
        if optimized_schedule.get('method') != 'heuristic_fallback':
            optimized_schedule = lns_optimizer.optimize(
                initial_solution=optimized_schedule,
                trains=request.trains,
                tracks=request.tracks
            )
        
        # Add metadata
        optimized_schedule['timestamp'] = datetime.now().isoformat()
        optimized_schedule['optimization_method'] = 'CP_LNS'
        optimized_schedule['input_trains'] = len(request.trains)
        optimized_schedule['input_tracks'] = len(request.tracks)
        
        return {
            "success": True,
            "optimized_schedule": optimized_schedule
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# ---- Reinforcement Learning Feedback Endpoints ----

@app.post("/decisions/{decision_id}/accept")
def accept_decision(decision_id: str, action: DecisionAction):
    """
    Accept an AI decision and record feedback for RL training
    """
    try:
        # Find the decision in our data
        decision = None
        for d in ai_decisions_data:
            if d['id'] == decision_id:
                decision = d
                break
        
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")
        
        # Record the decision in history
        record_id = decision_history.record_decision(
            decision_id=decision_id,
            action="accept",
            controller_id=action.controller_id,
            decision_data=decision,
            feedback_score=action.feedback_score,
            context=action.context
        )
        
        # Update decision status
        decision['status'] = 'accepted'
        decision['accepted_at'] = datetime.now().isoformat()
        decision['accepted_by'] = action.controller_id
        
        return {
            "success": True,
            "message": "Decision accepted successfully",
            "record_id": record_id,
            "decision": decision
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to accept decision: {str(e)}")

@app.post("/decisions/{decision_id}/reject")
def reject_decision(decision_id: str, action: DecisionAction):
    """
    Reject an AI decision and record feedback for RL training
    """
    try:
        # Find the decision in our data
        decision = None
        for d in ai_decisions_data:
            if d['id'] == decision_id:
                decision = d
                break
        
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")
        
        # Record the decision in history
        record_id = decision_history.record_decision(
            decision_id=decision_id,
            action="reject",
            controller_id=action.controller_id,
            decision_data=decision,
            feedback_score=action.feedback_score,
            context=action.context
        )
        
        # Update decision status
        decision['status'] = 'rejected'
        decision['rejected_at'] = datetime.now().isoformat()
        decision['rejected_by'] = action.controller_id
        
        return {
            "success": True,
            "message": "Decision rejected successfully",
            "record_id": record_id,
            "decision": decision
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject decision: {str(e)}")

@app.get("/decisions/history")
def get_decision_history(limit: int = 100, days: int = 30):
    """
    Get decision history for RL feedback analysis
    """
    try:
        start_date = datetime.now() - timedelta(days=days)
        history = decision_history.get_decision_history(
            limit=limit,
            start_date=start_date
        )
        
        stats = decision_history.get_decision_stats()
        
        return {
            "success": True,
            "history": history,
            "stats": stats,
            "limit": limit,
            "days": days
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.get("/analytics/performance")
def get_model_performance():
    """
    Get ML model performance metrics
    """
    try:
        delay_performance = decision_history.get_model_performance("delay_prediction")
        routing_performance = decision_history.get_model_performance("routing")
        
        return {
            "success": True,
            "delay_prediction": delay_performance,
            "routing": routing_performance,
            "overall_stats": decision_history.get_decision_stats()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance: {str(e)}")

@app.post("/feedback/model")
def record_model_feedback(
    model_type: str,
    input_features: Dict[str, Any],
    prediction: Dict[str, Any],
    actual_outcome: Dict[str, Any],
    feedback_score: float
):
    """
    Record feedback for ML model improvement
    """
    try:
        feedback_id = decision_history.record_model_feedback(
            model_type=model_type,
            input_features=input_features,
            prediction=prediction,
            actual_outcome=actual_outcome,
            feedback_score=feedback_score
        )
        
        return {
            "success": True,
            "message": "Model feedback recorded successfully",
            "feedback_id": feedback_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")


# ---- WebSocket for Real-Time Train Updates ----
@app.websocket("/ws/trains")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate random train update
        update = {
            "train": random.choice(["Express 101", "Passenger 202", "Freight 303"]),
            "status": random.choice(["On Time", "Delayed", "Rerouted"]),
            "delay": random.randint(0, 15),
        }
        await websocket.send_json(update)
        await asyncio.sleep(3)  # send every 3 sec

# WebSocket for ML Predictions Updates
@app.websocket("/ws/predictions")
async def websocket_predictions(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate prediction updates
        train_ids = ["EXP-101", "FRT-203", "LOC-78"]
        train_id = random.choice(train_ids)
        
        update = {
            "trainId": train_id,
            "predictedDelay": random.randint(0, 30),
            "confidence": round(random.uniform(0.7, 0.98), 2),
            "factors": random.choice([
                ["Weather conditions", "Traffic density"],
                ["Signal delay", "Track congestion"],
                ["Mechanical issue", "Platform availability"]
            ]),
            "recommendation": random.choice([
                "Maintain current schedule",
                "Reroute via alternate track",
                "Emergency maintenance required"
            ])
        }
        await websocket.send_json(update)
        await asyncio.sleep(5)  # send every 5 sec

# WebSocket for AI Decisions Updates  
@app.websocket("/ws/decisions")
async def websocket_decisions(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate new AI decisions
        decision_types = ["priority", "routing", "scheduling"]
        decision_type = random.choice(decision_types)
        
        update = {
            "id": f"dec-{random.randint(100, 999)}",
            "type": decision_type,
            "description": f"New {decision_type} decision for train optimization",
            "impact": f"Estimated time saving: {random.randint(5, 20)} minutes",
            "confidence": round(random.uniform(0.75, 0.95), 2),
            "status": "pending",
            "estimatedTimeSaving": random.randint(5, 20)
        }
        await websocket.send_json(update)
        await asyncio.sleep(8)  # send every 8 sec
