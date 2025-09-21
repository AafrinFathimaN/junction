"""
Decision History and Reinforcement Learning Feedback System
Tracks controller decisions for ML model improvement
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path
import uuid

class DecisionHistory:
    """Manages decision history for reinforcement learning feedback"""
    
    def __init__(self, db_path: str = "decision_history.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for decision history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create decisions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS decisions (
                id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL,
                action TEXT NOT NULL,  -- 'accept' or 'reject'
                timestamp DATETIME NOT NULL,
                controller_id TEXT,
                decision_data TEXT,  -- JSON string of original decision
                feedback_score REAL,  -- Optional feedback score
                context TEXT  -- Additional context
            )
        ''')
        
        # Create decision outcomes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS decision_outcomes (
                id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL,
                actual_delay REAL,
                predicted_delay REAL,
                time_saved REAL,
                passenger_impact INTEGER,
                cost_impact REAL,
                outcome_timestamp DATETIME,
                notes TEXT
            )
        ''')
        
        # Create model feedback table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_feedback (
                id TEXT PRIMARY KEY,
                model_type TEXT NOT NULL,  -- 'delay_prediction', 'routing', etc.
                input_features TEXT,  -- JSON string
                prediction TEXT,  -- JSON string
                actual_outcome TEXT,  -- JSON string
                feedback_score REAL,
                timestamp DATETIME NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def record_decision(self, decision_id: str, action: str, 
                       controller_id: str = None, decision_data: Dict = None,
                       feedback_score: float = None, context: str = None) -> str:
        """Record a controller's decision (accept/reject)"""
        record_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO decisions 
            (id, decision_id, action, timestamp, controller_id, decision_data, feedback_score, context)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            record_id,
            decision_id,
            action,
            datetime.now().isoformat(),
            controller_id,
            json.dumps(decision_data) if decision_data else None,
            feedback_score,
            context
        ))
        
        conn.commit()
        conn.close()
        
        return record_id
    
    def record_outcome(self, decision_id: str, actual_delay: float = None,
                      predicted_delay: float = None, time_saved: float = None,
                      passenger_impact: int = None, cost_impact: float = None,
                      notes: str = None) -> str:
        """Record the actual outcome of a decision"""
        outcome_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO decision_outcomes
            (id, decision_id, actual_delay, predicted_delay, time_saved, 
             passenger_impact, cost_impact, outcome_timestamp, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            outcome_id,
            decision_id,
            actual_delay,
            predicted_delay,
            time_saved,
            passenger_impact,
            cost_impact,
            datetime.now().isoformat(),
            notes
        ))
        
        conn.commit()
        conn.close()
        
        return outcome_id
    
    def record_model_feedback(self, model_type: str, input_features: Dict,
                            prediction: Dict, actual_outcome: Dict,
                            feedback_score: float) -> str:
        """Record feedback for ML model improvement"""
        feedback_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO model_feedback
            (id, model_type, input_features, prediction, actual_outcome, feedback_score, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            feedback_id,
            model_type,
            json.dumps(input_features),
            json.dumps(prediction),
            json.dumps(actual_outcome),
            feedback_score,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return feedback_id
    
    def get_decision_history(self, limit: int = 100, 
                           start_date: datetime = None,
                           end_date: datetime = None) -> List[Dict]:
        """Get decision history with optional filtering"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT d.*, o.actual_delay, o.predicted_delay, o.time_saved, o.passenger_impact
            FROM decisions d
            LEFT JOIN decision_outcomes o ON d.decision_id = o.decision_id
        '''
        
        conditions = []
        params = []
        
        if start_date:
            conditions.append("d.timestamp >= ?")
            params.append(start_date.isoformat())
        
        if end_date:
            conditions.append("d.timestamp <= ?")
            params.append(end_date.isoformat())
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY d.timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        columns = [description[0] for description in cursor.description]
        history = []
        
        for row in rows:
            record = dict(zip(columns, row))
            if record['decision_data']:
                record['decision_data'] = json.loads(record['decision_data'])
            history.append(record)
        
        conn.close()
        return history
    
    def get_decision_stats(self) -> Dict[str, Any]:
        """Get statistics about decision patterns"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Overall acceptance rate
        cursor.execute('SELECT action, COUNT(*) FROM decisions GROUP BY action')
        action_counts = dict(cursor.fetchall())
        total_decisions = sum(action_counts.values())
        acceptance_rate = action_counts.get('accept', 0) / total_decisions if total_decisions > 0 else 0
        
        # Average feedback scores
        cursor.execute('SELECT AVG(feedback_score) FROM decisions WHERE feedback_score IS NOT NULL')
        avg_feedback = cursor.fetchone()[0] or 0
        
        # Decision types
        cursor.execute('''
            SELECT json_extract(decision_data, '$.type') as decision_type, COUNT(*)
            FROM decisions 
            WHERE decision_data IS NOT NULL
            GROUP BY decision_type
        ''')
        decision_types = dict(cursor.fetchall())
        
        # Time-based patterns
        cursor.execute('''
            SELECT strftime('%H', timestamp) as hour, COUNT(*)
            FROM decisions
            GROUP BY hour
            ORDER BY hour
        ''')
        hourly_patterns = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            'total_decisions': total_decisions,
            'acceptance_rate': round(acceptance_rate, 3),
            'average_feedback_score': round(avg_feedback, 2),
            'decision_types': decision_types,
            'hourly_patterns': hourly_patterns,
            'last_updated': datetime.now().isoformat()
        }
    
    def get_model_performance(self, model_type: str = None) -> Dict[str, Any]:
        """Get performance metrics for ML models"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = 'SELECT * FROM model_feedback'
        params = []
        
        if model_type:
            query += ' WHERE model_type = ?'
            params.append(model_type)
        
        query += ' ORDER BY timestamp DESC LIMIT 1000'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return {'error': 'No model feedback data available'}
        
        # Calculate performance metrics
        feedback_scores = [row[5] for row in rows if row[5] is not None]
        avg_score = sum(feedback_scores) / len(feedback_scores) if feedback_scores else 0
        
        # Parse predictions and outcomes for accuracy analysis
        accuracy_data = []
        for row in rows:
            try:
                prediction = json.loads(row[3])
                outcome = json.loads(row[4])
                
                if 'predicted_delay' in prediction and 'actual_delay' in outcome:
                    error = abs(prediction['predicted_delay'] - outcome['actual_delay'])
                    accuracy_data.append(error)
            except:
                continue
        
        avg_error = sum(accuracy_data) / len(accuracy_data) if accuracy_data else 0
        
        conn.close()
        
        return {
            'total_feedback_records': len(rows),
            'average_feedback_score': round(avg_score, 3),
            'average_prediction_error': round(avg_error, 2),
            'model_type': model_type or 'all',
            'last_updated': datetime.now().isoformat()
        }
    
    def export_training_data(self, model_type: str = None) -> List[Dict]:
        """Export data for model retraining"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT input_features, prediction, actual_outcome, feedback_score
            FROM model_feedback
        '''
        params = []
        
        if model_type:
            query += ' WHERE model_type = ?'
            params.append(model_type)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        training_data = []
        for row in rows:
            try:
                training_data.append({
                    'input_features': json.loads(row[0]),
                    'prediction': json.loads(row[1]),
                    'actual_outcome': json.loads(row[2]),
                    'feedback_score': row[3]
                })
            except:
                continue
        
        conn.close()
        return training_data

# Global decision history instance
decision_history = DecisionHistory()
