"""
Sandbox Simulation Engine for Junction Genius
Dynamic train simulation with real-time recalculation of outcomes
"""

import numpy as np
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
import json

class SandboxSimulator:
    """Sandbox simulation engine for testing train scenarios"""
    
    def __init__(self):
        self.current_scenario = None
        self.simulation_results = {}
        self.metrics = {
            'delays_avoided': 0,
            'conflicts_resolved': 0,
            'total_delay_time': 0,
            'efficiency_score': 0.0,
            'punctuality_rate': 0.0
        }
        
    def create_scenario(self, trains: List[Dict], tracks: List[Dict], 
                       weather_conditions: Dict = None, 
                       time_horizon: int = 120) -> Dict[str, Any]:
        """Create a new simulation scenario"""
        
        scenario = {
            'id': f"scenario_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'trains': trains,
            'tracks': tracks,
            'weather_conditions': weather_conditions or {
                'visibility': 1.0,
                'precipitation': 0.0,
                'wind_speed': 0.0,
                'temperature': 20.0
            },
            'time_horizon': time_horizon,
            'created_at': datetime.now().isoformat(),
            'status': 'created'
        }
        
        self.current_scenario = scenario
        return scenario
    
    def simulate_baseline(self, scenario: Dict) -> Dict[str, Any]:
        """Simulate baseline scenario without AI optimization"""
        
        trains = scenario['trains']
        tracks = scenario['tracks']
        weather = scenario['weather_conditions']
        
        # Calculate baseline delays and conflicts
        baseline_results = {
            'total_delay': 0,
            'conflicts': 0,
            'train_delays': {},
            'track_utilization': {},
            'punctuality_rate': 0.0
        }
        
        # Simulate each train
        for train in trains:
            train_id = train['id']
            route = train.get('route', [])
            priority = train.get('priority', 1)
            current_delay = train.get('current_delay', 0)
            
            # Calculate weather impact
            weather_delay = self._calculate_weather_impact(weather)
            
            # Calculate route complexity impact
            route_delay = len(route) * 2  # 2 minutes per track segment
            
            # Calculate priority impact (lower priority = more delays)
            priority_delay = (3 - priority) * 5
            
            # Total delay for this train
            total_delay = current_delay + weather_delay + route_delay + priority_delay
            total_delay = max(0, total_delay + random.normalvariate(0, 3))  # Add noise
            
            baseline_results['train_delays'][train_id] = total_delay
            baseline_results['total_delay'] += total_delay
        
        # Calculate conflicts (simplified)
        track_usage = {}
        for train in trains:
            for track_id in train.get('route', []):
                if track_id not in track_usage:
                    track_usage[track_id] = 0
                track_usage[track_id] += 1
        
        # Count conflicts (when multiple trains use same track)
        for track_id, usage_count in track_usage.items():
            track_capacity = next((t['capacity'] for t in tracks if t['id'] == track_id), 1)
            if usage_count > track_capacity:
                baseline_results['conflicts'] += usage_count - track_capacity
        
        # Calculate punctuality rate
        on_time_trains = sum(1 for delay in baseline_results['train_delays'].values() if delay < 5)
        baseline_results['punctuality_rate'] = on_time_trains / len(trains) if trains else 0
        
        # Track utilization
        for track in tracks:
            track_id = track['id']
            utilization = track_usage.get(track_id, 0) / track.get('capacity', 1)
            baseline_results['track_utilization'][track_id] = min(1.0, utilization)
        
        return baseline_results
    
    def simulate_optimized(self, scenario: Dict, optimization_result: Dict) -> Dict[str, Any]:
        """Simulate scenario with AI optimization applied"""
        
        baseline = self.simulate_baseline(scenario)
        
        # Apply optimization improvements
        optimized_results = baseline.copy()
        
        # Reduce delays based on optimization
        delay_reduction = optimization_result.get('total_delay_reduction', 0)
        conflicts_resolved = optimization_result.get('conflicts_resolved', 0)
        
        # Apply improvements
        optimized_results['total_delay'] = max(0, baseline['total_delay'] - delay_reduction)
        optimized_results['conflicts'] = max(0, baseline['conflicts'] - conflicts_resolved)
        
        # Improve individual train delays
        improvement_factor = 0.7 if delay_reduction > 0 else 1.0
        for train_id in optimized_results['train_delays']:
            optimized_results['train_delays'][train_id] *= improvement_factor
        
        # Recalculate punctuality rate
        on_time_trains = sum(1 for delay in optimized_results['train_delays'].values() if delay < 5)
        optimized_results['punctuality_rate'] = on_time_trains / len(scenario['trains']) if scenario['trains'] else 0
        
        return optimized_results
    
    def evaluate_scenario(self, scenario: Dict, optimization_result: Dict = None) -> Dict[str, Any]:
        """Evaluate a scenario and return comprehensive metrics"""
        
        baseline_results = self.simulate_baseline(scenario)
        
        if optimization_result:
            optimized_results = self.simulate_optimized(scenario, optimization_result)
        else:
            optimized_results = baseline_results
        
        # Calculate improvements
        delays_avoided = baseline_results['total_delay'] - optimized_results['total_delay']
        conflicts_resolved = baseline_results['conflicts'] - optimized_results['conflicts']
        
        # Calculate efficiency score (0-100)
        efficiency_score = self._calculate_efficiency_score(baseline_results, optimized_results)
        
        evaluation = {
            'scenario_id': scenario['id'],
            'baseline': baseline_results,
            'optimized': optimized_results,
            'improvements': {
                'delays_avoided': delays_avoided,
                'conflicts_resolved': conflicts_resolved,
                'punctuality_improvement': optimized_results['punctuality_rate'] - baseline_results['punctuality_rate'],
                'efficiency_score': efficiency_score
            },
            'metrics': {
                'total_trains': len(scenario['trains']),
                'total_tracks': len(scenario['tracks']),
                'simulation_time': scenario['time_horizon'],
                'weather_impact': self._calculate_weather_impact(scenario['weather_conditions'])
            },
            'evaluated_at': datetime.now().isoformat()
        }
        
        # Update internal metrics
        self.metrics.update({
            'delays_avoided': delays_avoided,
            'conflicts_resolved': conflicts_resolved,
            'total_delay_time': optimized_results['total_delay'],
            'efficiency_score': efficiency_score,
            'punctuality_rate': optimized_results['punctuality_rate']
        })
        
        self.simulation_results[scenario['id']] = evaluation
        return evaluation
    
    def _calculate_weather_impact(self, weather: Dict) -> float:
        """Calculate delay impact from weather conditions"""
        visibility = weather.get('visibility', 1.0)
        precipitation = weather.get('precipitation', 0.0)
        wind_speed = weather.get('wind_speed', 0.0)
        
        # Weather impact formula (in minutes)
        impact = 0
        impact += (1.0 - visibility) * 15  # Poor visibility
        impact += precipitation * 10       # Rain/snow
        impact += min(wind_speed / 50, 1.0) * 8  # High winds
        
        return impact
    
    def _calculate_efficiency_score(self, baseline: Dict, optimized: Dict) -> float:
        """Calculate overall efficiency score (0-100)"""
        
        # Delay improvement (40% weight)
        delay_improvement = 0
        if baseline['total_delay'] > 0:
            delay_improvement = (baseline['total_delay'] - optimized['total_delay']) / baseline['total_delay']
        delay_score = min(100, delay_improvement * 100) * 0.4
        
        # Conflict resolution (30% weight)
        conflict_improvement = 0
        if baseline['conflicts'] > 0:
            conflict_improvement = (baseline['conflicts'] - optimized['conflicts']) / baseline['conflicts']
        conflict_score = min(100, conflict_improvement * 100) * 0.3
        
        # Punctuality (30% weight)
        punctuality_score = optimized['punctuality_rate'] * 100 * 0.3
        
        total_score = delay_score + conflict_score + punctuality_score
        return round(total_score, 2)
    
    def get_performance_analytics(self) -> Dict[str, Any]:
        """Get comprehensive performance analytics"""
        
        if not self.simulation_results:
            return {
                'total_simulations': 0,
                'average_efficiency_score': 0,
                'total_delays_avoided': 0,
                'total_conflicts_resolved': 0,
                'average_punctuality_rate': 0,
                'recommendations': []
            }
        
        results = list(self.simulation_results.values())
        
        analytics = {
            'total_simulations': len(results),
            'average_efficiency_score': np.mean([r['improvements']['efficiency_score'] for r in results]),
            'total_delays_avoided': sum(r['improvements']['delays_avoided'] for r in results),
            'total_conflicts_resolved': sum(r['improvements']['conflicts_resolved'] for r in results),
            'average_punctuality_rate': np.mean([r['optimized']['punctuality_rate'] for r in results]),
            'best_scenario': max(results, key=lambda x: x['improvements']['efficiency_score']),
            'worst_scenario': min(results, key=lambda x: x['improvements']['efficiency_score']),
            'recommendations': self._generate_recommendations(results)
        }
        
        return analytics
    
    def _generate_recommendations(self, results: List[Dict]) -> List[str]:
        """Generate recommendations based on simulation results"""
        recommendations = []
        
        if not results:
            return recommendations
        
        avg_efficiency = np.mean([r['improvements']['efficiency_score'] for r in results])
        avg_punctuality = np.mean([r['optimized']['punctuality_rate'] for r in results])
        
        if avg_efficiency < 50:
            recommendations.append("Consider implementing more aggressive optimization strategies")
        
        if avg_punctuality < 0.8:
            recommendations.append("Focus on improving train punctuality through better scheduling")
        
        high_conflict_scenarios = [r for r in results if r['baseline']['conflicts'] > 5]
        if len(high_conflict_scenarios) > len(results) * 0.3:
            recommendations.append("Review track capacity and consider infrastructure improvements")
        
        if avg_efficiency > 80:
            recommendations.append("Excellent performance! Current optimization strategies are highly effective")
        
        return recommendations

# Global sandbox simulator instance
sandbox_simulator = SandboxSimulator()