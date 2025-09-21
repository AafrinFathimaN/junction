"""
Schedule Optimization Engine for Junction Genius
Uses Constraint Programming and Large Neighbourhood Search for train scheduling
"""

from ortools.sat.python import cp_model
import numpy as np
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
import random

class ScheduleOptimizer:
    """Constraint Programming-based schedule optimizer"""
    
    def __init__(self):
        self.model = None
        self.solver = None
        self.variables = {}
        
    def optimize_schedule(self, trains: List[Dict], tracks: List[Dict], 
                         current_schedule: Dict) -> Dict[str, Any]:
        """
        Optimize train schedule using constraint programming
        
        Args:
            trains: List of train information
            tracks: List of track/route information  
            current_schedule: Current schedule state
            
        Returns:
            Optimized schedule with reduced conflicts and delays
        """
        
        # Create CP model
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Define time horizon (e.g., next 2 hours)
        time_horizon = 120  # minutes
        time_slots = list(range(time_horizon))
        
        # Create variables for each train-track-time combination
        train_vars = {}
        for train in trains:
            train_id = train['id']
            train_vars[train_id] = {}
            
            for track in tracks:
                track_id = track['id']
                train_vars[train_id][track_id] = {}
                
                for time_slot in time_slots:
                    var_name = f"train_{train_id}_track_{track_id}_time_{time_slot}"
                    train_vars[train_id][track_id][time_slot] = self.model.NewBoolVar(var_name)
        
        # Add constraints
        self._add_track_capacity_constraints(train_vars, tracks, time_slots)
        self._add_train_sequence_constraints(train_vars, trains, tracks, time_slots)
        self._add_priority_constraints(train_vars, trains, tracks, time_slots)
        self._add_platform_constraints(train_vars, trains, tracks, time_slots)
        
        # Add objective: minimize total delay and conflicts
        self._add_objective(train_vars, trains, tracks, time_slots, current_schedule)
        
        # Solve the model
        status = self.solver.Solve(self.model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return self._extract_solution(train_vars, trains, tracks, time_slots)
        else:
            return self._fallback_optimization(trains, tracks, current_schedule)
    
    def _add_track_capacity_constraints(self, train_vars: Dict, tracks: List[Dict], 
                                      time_slots: List[int]):
        """Ensure track capacity limits are respected"""
        for track in tracks:
            track_id = track['id']
            capacity = track.get('capacity', 1)
            
            for time_slot in time_slots:
                # Sum of trains on this track at this time <= capacity
                trains_on_track = []
                for train_id in train_vars:
                    if track_id in train_vars[train_id]:
                        trains_on_track.append(train_vars[train_id][track_id][time_slot])
                
                if trains_on_track:
                    self.model.Add(sum(trains_on_track) <= capacity)
    
    def _add_train_sequence_constraints(self, train_vars: Dict, trains: List[Dict], 
                                      tracks: List[Dict], time_slots: List[int]):
        """Ensure trains follow logical sequence through tracks"""
        for train in trains:
            train_id = train['id']
            route = train.get('route', [])
            
            # Ensure train follows route sequence
            for i in range(len(route) - 1):
                current_track = route[i]
                next_track = route[i + 1]
                
                if (current_track in train_vars[train_id] and 
                    next_track in train_vars[train_id]):
                    
                    # If train is on current track at time t, it must be on next track at time t+1
                    for t in range(len(time_slots) - 1):
                        current_var = train_vars[train_id][current_track][t]
                        next_var = train_vars[train_id][next_track][t + 1]
                        self.model.Add(next_var >= current_var)
    
    def _add_priority_constraints(self, train_vars: Dict, trains: List[Dict], 
                                tracks: List[Dict], time_slots: List[int]):
        """Ensure priority trains get preference"""
        priority_trains = [t for t in trains if t.get('priority', 0) > 0]
        regular_trains = [t for t in trains if t.get('priority', 0) == 0]
        
        for track in tracks:
            track_id = track['id']
            
            for time_slot in time_slots:
                # Priority trains should have preference over regular trains
                for priority_train in priority_trains:
                    for regular_train in regular_trains:
                        if (track_id in train_vars[priority_train['id']] and 
                            track_id in train_vars[regular_train['id']]):
                            
                            priority_var = train_vars[priority_train['id']][track_id][time_slot]
                            regular_var = train_vars[regular_train['id']][track_id][time_slot]
                            
                            # If regular train is on track, priority train should be too
                            self.model.Add(priority_var >= regular_var)
    
    def _add_platform_constraints(self, train_vars: Dict, trains: List[Dict], 
                                tracks: List[Dict], time_slots: List[int]):
        """Ensure platform availability constraints"""
        platforms = [t for t in tracks if t.get('type') == 'platform']
        
        for platform in platforms:
            platform_id = platform['id']
            capacity = platform.get('capacity', 1)
            
            for time_slot in time_slots:
                trains_at_platform = []
                for train_id in train_vars:
                    if platform_id in train_vars[train_id]:
                        trains_at_platform.append(train_vars[train_id][platform_id][time_slot])
                
                if trains_at_platform:
                    self.model.Add(sum(trains_at_platform) <= capacity)
    
    def _add_objective(self, train_vars: Dict, trains: List[Dict], tracks: List[Dict], 
                      time_slots: List[int], current_schedule: Dict):
        """Add objective function to minimize delays and conflicts"""
        objective_terms = []
        
        # Minimize delays
        for train in trains:
            train_id = train['id']
            scheduled_time = current_schedule.get(train_id, {}).get('scheduled_time', 0)
            
            for track in tracks:
                track_id = track['id']
                if track_id in train_vars[train_id]:
                    for time_slot in time_slots:
                        delay_penalty = max(0, time_slot - scheduled_time)
                        var = train_vars[train_id][track_id][time_slot]
                        objective_terms.append(delay_penalty * var)
        
        # Minimize conflicts (multiple trains on same track)
        for track in tracks:
            track_id = track['id']
            for time_slot in time_slots:
                trains_on_track = []
                for train_id in train_vars:
                    if track_id in train_vars[train_id]:
                        trains_on_track.append(train_vars[train_id][track_id][time_slot])
                
                if len(trains_on_track) > 1:
                    # Penalty for conflicts
                    conflict_penalty = sum(trains_on_track) - 1
                    objective_terms.append(100 * conflict_penalty)
        
        if objective_terms:
            self.model.Minimize(sum(objective_terms))
    
    def _extract_solution(self, train_vars: Dict, trains: List[Dict], 
                        tracks: List[Dict], time_slots: List[int]) -> Dict[str, Any]:
        """Extract optimized schedule from solved model"""
        optimized_schedule = {
            'trains': {},
            'conflicts_resolved': 0,
            'total_delay_reduction': 0,
            'optimization_time': self.solver.WallTime()
        }
        
        for train in trains:
            train_id = train['id']
            optimized_schedule['trains'][train_id] = {
                'route': [],
                'timing': {},
                'delays': []
            }
            
            for track in tracks:
                track_id = track['id']
                if track_id in train_vars[train_id]:
                    for time_slot in time_slots:
                        if self.solver.Value(train_vars[train_id][track_id][time_slot]) == 1:
                            optimized_schedule['trains'][train_id]['route'].append(track_id)
                            optimized_schedule['trains'][train_id]['timing'][track_id] = time_slot
        
        return optimized_schedule
    
    def _fallback_optimization(self, trains: List[Dict], tracks: List[Dict], 
                             current_schedule: Dict) -> Dict[str, Any]:
        """Fallback optimization using simple heuristics"""
        optimized_schedule = {
            'trains': {},
            'conflicts_resolved': 0,
            'total_delay_reduction': 0,
            'optimization_time': 0.1,
            'method': 'heuristic_fallback'
        }
        
        # Simple heuristic: prioritize by train priority and delay
        sorted_trains = sorted(trains, key=lambda t: (t.get('priority', 0), t.get('current_delay', 0)), reverse=True)
        
        track_usage = {track['id']: [] for track in tracks}
        
        for train in sorted_trains:
            train_id = train['id']
            route = train.get('route', [])
            
            optimized_schedule['trains'][train_id] = {
                'route': route,
                'timing': {},
                'delays': []
            }
            
            current_time = 0
            for track_id in route:
                # Find next available time slot
                while any(track_id in usage for usage in track_usage[track_id]):
                    current_time += 1
                
                optimized_schedule['trains'][train_id]['timing'][track_id] = current_time
                track_usage[track_id].append(current_time)
                current_time += 1
        
        return optimized_schedule

class LargeNeighbourhoodSearch:
    """Large Neighbourhood Search for advanced optimization"""
    
    def __init__(self, max_iterations: int = 100):
        self.max_iterations = max_iterations
        
    def optimize(self, initial_solution: Dict, trains: List[Dict], 
                tracks: List[Dict]) -> Dict[str, Any]:
        """Apply Large Neighbourhood Search optimization"""
        best_solution = initial_solution.copy()
        best_cost = self._calculate_cost(best_solution)
        
        for iteration in range(self.max_iterations):
            # Destroy and repair
            destroyed_solution = self._destroy_solution(best_solution, trains)
            repaired_solution = self._repair_solution(destroyed_solution, trains, tracks)
            
            # Evaluate new solution
            new_cost = self._calculate_cost(repaired_solution)
            
            # Accept if better
            if new_cost < best_cost:
                best_solution = repaired_solution
                best_cost = new_cost
        
        return best_solution
    
    def _destroy_solution(self, solution: Dict, trains: List[Dict]) -> Dict:
        """Destroy part of the solution (remove some train assignments)"""
        destroyed = solution.copy()
        
        # Remove assignments for 20% of trains
        num_to_remove = max(1, len(trains) // 5)
        trains_to_remove = random.sample(trains, num_to_remove)
        
        for train in trains_to_remove:
            train_id = train['id']
            if train_id in destroyed['trains']:
                destroyed['trains'][train_id]['timing'] = {}
        
        return destroyed
    
    def _repair_solution(self, solution: Dict, trains: List[Dict], 
                        tracks: List[Dict]) -> Dict:
        """Repair the destroyed solution"""
        repaired = solution.copy()
        
        # Use greedy repair for missing assignments
        for train in trains:
            train_id = train['id']
            if train_id not in repaired['trains'] or not repaired['trains'][train_id]['timing']:
                # Reassign this train
                route = train.get('route', [])
                current_time = 0
                
                for track_id in route:
                    repaired['trains'][train_id]['timing'][track_id] = current_time
                    current_time += 1
        
        return repaired
    
    def _calculate_cost(self, solution: Dict) -> float:
        """Calculate cost of a solution"""
        total_cost = 0
        
        for train_id, train_data in solution.get('trains', {}).items():
            timing = train_data.get('timing', {})
            for track_id, time in timing.items():
                total_cost += time  # Simple cost: sum of all times
        
        return total_cost

# Global optimizer instances
schedule_optimizer = ScheduleOptimizer()
lns_optimizer = LargeNeighbourhoodSearch()
