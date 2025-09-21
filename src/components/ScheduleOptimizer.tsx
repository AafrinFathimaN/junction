import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Train, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Train {
  id: string
  route: string[]
  priority: number
  current_delay: number
}

interface Track {
  id: string
  capacity: number
  type: string
}

interface OptimizedSchedule {
  trains: Record<string, any>
  conflicts_resolved: number
  total_delay_reduction: number
  optimization_time: number
  optimization_method: string
}

const ScheduleOptimizer: React.FC = () => {
  const [trains, setTrains] = useState<Train[]>([
    { id: 'EXP-101', route: ['A', 'B', 'C'], priority: 2, current_delay: 5 },
    { id: 'LOC-78', route: ['A', 'D', 'E'], priority: 1, current_delay: 0 },
    { id: 'FRT-203', route: ['B', 'C', 'F'], priority: 0, current_delay: 10 }
  ])
  
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'A', capacity: 1, type: 'junction' },
    { id: 'B', capacity: 2, type: 'track' },
    { id: 'C', capacity: 1, type: 'junction' },
    { id: 'D', capacity: 1, type: 'track' },
    { id: 'E', capacity: 1, type: 'platform' },
    { id: 'F', capacity: 1, type: 'platform' }
  ])
  
  const [optimizedSchedule, setOptimizedSchedule] = useState<OptimizedSchedule | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trains,
          tracks,
          current_schedule: trains.reduce((acc, train) => {
            acc[train.id] = { scheduled_time: 0 }
            return acc
          }, {} as Record<string, any>)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOptimizedSchedule(data.optimized_schedule)
      }
    } catch (error) {
      console.error('Failed to optimize schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTrain = () => {
    const newTrain: Train = {
      id: `TRAIN-${trains.length + 1}`,
      route: ['A', 'B'],
      priority: 1,
      current_delay: 0
    }
    setTrains([...trains, newTrain])
  }

  const addTrack = () => {
    const newTrack: Track = {
      id: String.fromCharCode(65 + tracks.length),
      capacity: 1,
      type: 'track'
    }
    setTracks([...tracks, newTrack])
  }

  const updateTrain = (index: number, field: keyof Train, value: any) => {
    const updatedTrains = [...trains]
    updatedTrains[index] = { ...updatedTrains[index], [field]: value }
    setTrains(updatedTrains)
  }

  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updatedTracks = [...tracks]
    updatedTracks[index] = { ...updatedTracks[index], [field]: value }
    setTracks(updatedTracks)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Optimizer</h1>
          <p className="text-muted-foreground">AI-powered train schedule optimization using constraint programming</p>
        </div>
        <Button onClick={handleOptimize} disabled={loading}>
          <Settings className="h-4 w-4 mr-2" />
          {loading ? 'Optimizing...' : 'Optimize Schedule'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trains Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trains</CardTitle>
                <CardDescription>Configure train routes and priorities</CardDescription>
              </div>
              <Button size="sm" onClick={addTrain}>
                Add Train
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trains.map((train, index) => (
                <div key={train.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Train className="h-4 w-4" />
                      <span className="font-medium">{train.id}</span>
                    </div>
                    <Badge variant={train.priority === 2 ? 'default' : train.priority === 1 ? 'secondary' : 'outline'}>
                      Priority {train.priority}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Route</label>
                      <input
                        type="text"
                        value={train.route.join(', ')}
                        onChange={(e) => updateTrain(index, 'route', e.target.value.split(', '))}
                        className="w-full p-2 text-sm border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Current Delay (min)</label>
                      <input
                        type="number"
                        value={train.current_delay}
                        onChange={(e) => updateTrain(index, 'current_delay', parseInt(e.target.value))}
                        className="w-full p-2 text-sm border rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium">Priority</label>
                    <select
                      value={train.priority}
                      onChange={(e) => updateTrain(index, 'priority', parseInt(e.target.value))}
                      className="w-full p-2 text-sm border rounded"
                    >
                      <option value={0}>Low (Freight)</option>
                      <option value={1}>Medium (Local)</option>
                      <option value={2}>High (Express)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tracks Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tracks & Platforms</CardTitle>
                <CardDescription>Configure track capacities and types</CardDescription>
              </div>
              <Button size="sm" onClick={addTrack}>
                Add Track
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tracks.map((track, index) => (
                <div key={track.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium">Track {track.id}</span>
                    </div>
                    <Badge variant="outline">{track.type}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={track.capacity}
                        onChange={(e) => updateTrack(index, 'capacity', parseInt(e.target.value))}
                        className="w-full p-2 text-sm border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Type</label>
                      <select
                        value={track.type}
                        onChange={(e) => updateTrack(index, 'type', e.target.value)}
                        className="w-full p-2 text-sm border rounded"
                      >
                        <option value="track">Track</option>
                        <option value="junction">Junction</option>
                        <option value="platform">Platform</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Results */}
      {optimizedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Optimization Results</span>
            </CardTitle>
            <CardDescription>
              Schedule optimized using {optimizedSchedule.optimization_method}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {optimizedSchedule.conflicts_resolved}
                </div>
                <div className="text-sm text-green-600">Conflicts Resolved</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {optimizedSchedule.total_delay_reduction}
                </div>
                <div className="text-sm text-blue-600">Minutes Saved</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {optimizedSchedule.optimization_time.toFixed(3)}s
                </div>
                <div className="text-sm text-purple-600">Optimization Time</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Optimized Train Schedules</h4>
              <div className="space-y-3">
                {Object.entries(optimizedSchedule.trains).map(([trainId, trainData]) => (
                  <div key={trainId} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Train className="h-4 w-4" />
                        <span className="font-medium">{trainId}</span>
                      </div>
                      <Badge variant="outline">
                        Route: {trainData.route?.join(' → ') || 'N/A'}
                      </Badge>
                    </div>
                    {trainData.timing && (
                      <div className="text-sm text-muted-foreground">
                        Timing: {Object.entries(trainData.timing).map(([track, time]) => 
                          `${track}: ${time}min`
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ScheduleOptimizer
