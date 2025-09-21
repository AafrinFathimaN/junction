"""
Machine Learning Models for Junction Genius
Gradient Boosting models for delay prediction and routing optimization
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import random

class TrainDelayPredictor:
    """Gradient Boosting model for predicting train delays"""
    
    def __init__(self):
        self.delay_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.routing_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_synthetic_data(self, n_samples: int = 1000) -> pd.DataFrame:
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            # Weather conditions (0-1 scale)
            weather = random.choice([0.0, 0.3, 0.7, 1.0])  # Clear, Light, Moderate, Severe
            
            # Traffic density (0-1 scale)
            traffic = random.uniform(0.0, 1.0)
            
            # Time of day (0-23)
            hour = random.randint(0, 23)
            
            # Day of week (0-6)
            day_of_week = random.randint(0, 6)
            
            # Track condition (0-1 scale)
            track_condition = random.uniform(0.7, 1.0)
            
            # Signal delays (0-1 scale)
            signal_delay = random.uniform(0.0, 0.5)
            
            # Platform availability (0-1 scale)
            platform_availability = random.uniform(0.5, 1.0)
            
            # Train type (encoded)
            train_type = random.choice(['Express', 'Local', 'Freight'])
            
            # Route complexity (number of junctions)
            route_complexity = random.randint(1, 8)
            
            # Calculate delay based on factors
            base_delay = 0
            base_delay += weather * 15  # Weather impact
            base_delay += traffic * 10  # Traffic impact
            base_delay += (1 - track_condition) * 20  # Track condition impact
            base_delay += signal_delay * 25  # Signal delay impact
            base_delay += (1 - platform_availability) * 12  # Platform impact
            base_delay += route_complexity * 2  # Route complexity
            base_delay += random.normalvariate(0, 5)  # Random noise
            
            # Peak hour multiplier
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                base_delay *= 1.3
                
            # Weekend effect
            if day_of_week >= 5:
                base_delay *= 0.8
                
            delay = max(0, base_delay)
            
            # Determine optimal route
            optimal_route = 'A' if delay < 10 else 'B' if delay < 20 else 'C'
            
            data.append({
                'weather': weather,
                'traffic_density': traffic,
                'hour': hour,
                'day_of_week': day_of_week,
                'track_condition': track_condition,
                'signal_delay': signal_delay,
                'platform_availability': platform_availability,
                'train_type': train_type,
                'route_complexity': route_complexity,
                'delay': delay,
                'optimal_route': optimal_route
            })
            
        return pd.DataFrame(data)
    
    def train(self, data: pd.DataFrame = None):
        """Train the models on provided or synthetic data"""
        if data is None:
            data = self.generate_synthetic_data()
            
        # Prepare features
        feature_columns = [
            'weather', 'traffic_density', 'hour', 'day_of_week',
            'track_condition', 'signal_delay', 'platform_availability',
            'route_complexity'
        ]
        
        # Encode categorical variables
        le_train_type = LabelEncoder()
        data['train_type_encoded'] = le_train_type.fit_transform(data['train_type'])
        self.label_encoders['train_type'] = le_train_type
        
        feature_columns.append('train_type_encoded')
        X = data[feature_columns]
        
        # Train delay prediction model
        y_delay = data['delay']
        X_scaled = self.scaler.fit_transform(X)
        self.delay_model.fit(X_scaled, y_delay)
        
        # Train routing model
        le_route = LabelEncoder()
        y_route = le_route.fit_transform(data['optimal_route'])
        self.label_encoders['route'] = le_route
        self.routing_model.fit(X_scaled, y_route)
        
        self.is_trained = True
        print("Models trained successfully!")
        
    def predict_delay(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict delay for given features"""
        if not self.is_trained:
            self.train()
            
        # Prepare feature vector
        feature_vector = np.array([
            features.get('weather', 0.0),
            features.get('traffic_density', 0.0),
            features.get('hour', 12),
            features.get('day_of_week', 0),
            features.get('track_condition', 1.0),
            features.get('signal_delay', 0.0),
            features.get('platform_availability', 1.0),
            features.get('route_complexity', 1),
            self.label_encoders['train_type'].transform([features.get('train_type', 'Express')])[0]
        ]).reshape(1, -1)
        
        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        # Predict delay
        predicted_delay = self.delay_model.predict(feature_vector_scaled)[0]
        confidence = min(0.95, max(0.6, 1.0 - abs(predicted_delay - features.get('current_delay', 0)) / 30))
        
        # Predict optimal route
        route_prediction = self.routing_model.predict(feature_vector_scaled)[0]
        optimal_route = self.label_encoders['route'].inverse_transform([route_prediction])[0]
        
        return {
            'predicted_delay': round(predicted_delay, 2),
            'confidence': round(confidence, 3),
            'optimal_route': optimal_route,
            'factors': self._analyze_factors(features),
            'recommendation': self._generate_recommendation(predicted_delay, optimal_route)
        }
    
    def _analyze_factors(self, features: Dict[str, Any]) -> List[str]:
        """Analyze which factors contribute most to delay prediction"""
        factors = []
        
        if features.get('weather', 0) > 0.5:
            factors.append("Weather conditions")
        if features.get('traffic_density', 0) > 0.6:
            factors.append("High traffic density")
        if features.get('track_condition', 1) < 0.8:
            factors.append("Poor track condition")
        if features.get('signal_delay', 0) > 0.3:
            factors.append("Signal delays")
        if features.get('platform_availability', 1) < 0.7:
            factors.append("Platform congestion")
        if features.get('route_complexity', 1) > 5:
            factors.append("Complex routing")
            
        return factors if factors else ["Normal operating conditions"]
    
    def _generate_recommendation(self, delay: float, route: str) -> str:
        """Generate recommendation based on prediction"""
        if delay < 5:
            return "Maintain current schedule"
        elif delay < 15:
            return f"Consider route {route} to minimize delay"
        elif delay < 30:
            return f"Reroute via {route} - significant delay expected"
        else:
            return "Emergency action required - consider holding train"

# Global model instance
delay_predictor = TrainDelayPredictor()
