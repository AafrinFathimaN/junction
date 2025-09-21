import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Map, Train, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface TrainPosition {
  id: string
  name: string
  position: { x: number; y: number }
  status: 'on-time' | 'delayed' | 'early'
  delay: number
  route: string[]
  currentTrack: string
}

const TrainMap: React.FC = () => {
  const [trains, setTrains] = useState<TrainPosition[]>([])
  const [selectedTrain, setSelectedTrain] = useState<TrainPosition | null>(null)

  // Mock train positions - in a real app, this would come from WebSocket
  useEffect(() => {
    const mockTrains: TrainPosition[] = [
      {
        id: 'EXP-101',
        name: 'Express 101',
        position: { x: 20, y: 30 },
        status: 'delayed',
        delay: 5,
        route: ['A', 'B', 'C', 'D'],
        currentTrack: 'B'
      },
      {
        id: 'LOC-78',
        name: 'Local 78',
        position: { x: 60, y: 50 },
        status: 'on-time',
        delay: 0,
        route: ['E', 'F', 'G'],
        currentTrack: 'F'
      },
      {
        id: 'FRT-203',
        name: 'Freight 203',
        position: { x: 40, y: 70 },
        status: 'delayed',
        delay: 12,
        route: ['H', 'I', 'J'],
        currentTrack: 'I'
      }
    ]
    setTrains(mockTrains)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-green-500'
      case 'delayed': return 'bg-red-500'
      case 'early': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time': return <CheckCircle className="h-4 w-4" />
      case 'delayed': return <AlertTriangle className="h-4 w-4" />
      case 'early': return <Clock className="h-4 w-4" />
      default: return <Train className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Train Map</h1>
          <p className="text-muted-foreground">Real-time train positions and status</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Map className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
          <Button>
            <Train className="h-4 w-4 mr-2" />
            Add Train
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Railway Network Map</CardTitle>
              <CardDescription>Interactive map showing train positions and routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                {/* Mock railway tracks */}
                <svg className="absolute inset-0 w-full h-full">
                  {/* Horizontal tracks */}
                  <line x1="0" y1="30" x2="100%" y2="30" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  <line x1="0" y1="50" x2="100%" y2="50" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  <line x1="0" y1="70" x2="100%" y2="70" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  
                  {/* Vertical tracks */}
                  <line x1="20" y1="0" x2="20" y2="100%" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  <line x1="40" y1="0" x2="40" y2="100%" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  <line x1="60" y1="0" x2="60" y2="100%" stroke="#374151" strokeWidth="3" strokeDasharray="5,5" />
                  
                  {/* Junctions */}
                  <circle cx="20" cy="30" r="4" fill="#6B7280" />
                  <circle cx="40" cy="50" r="4" fill="#6B7280" />
                  <circle cx="60" cy="70" r="4" fill="#6B7280" />
                  
                  {/* Train positions */}
                  {trains.map((train) => (
                    <g key={train.id}>
                      <circle 
                        cx={`${train.position.x}%`} 
                        cy={`${train.position.y}%`} 
                        r="8" 
                        fill={getStatusColor(train.status)}
                        className="cursor-pointer hover:r-10 transition-all"
                        onClick={() => setSelectedTrain(train)}
                      />
                      <text 
                        x={`${train.position.x}%`} 
                        y={`${train.position.y - 15}%`} 
                        textAnchor="middle" 
                        className="text-xs font-medium fill-gray-700"
                      >
                        {train.id}
                      </text>
                    </g>
                  ))}
                </svg>
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md">
                  <h4 className="font-medium text-sm mb-2">Status Legend</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs">On Time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-xs">Delayed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs">Early</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Train Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Train Status</CardTitle>
              <CardDescription>Current status of all trains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trains.map((train) => (
                  <div 
                    key={train.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTrain?.id === train.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTrain(train)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(train.status)}`} />
                        <span className="font-medium text-sm">{train.name}</span>
                      </div>
                      <Badge variant={train.status === 'delayed' ? 'destructive' : 'secondary'}>
                        {train.delay > 0 ? `+${train.delay}m` : 'On Time'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Track: {train.currentTrack}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Train Details */}
          {selectedTrain && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(selectedTrain.status)}
                  <span>{selectedTrain.name}</span>
                </CardTitle>
                <CardDescription>Detailed information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={selectedTrain.status === 'delayed' ? 'destructive' : 'secondary'}>
                      {selectedTrain.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delay</span>
                    <span className="text-sm">
                      {selectedTrain.delay > 0 ? `+${selectedTrain.delay} minutes` : 'On Time'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Track</span>
                    <span className="text-sm">{selectedTrain.currentTrack}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Route</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedTrain.route.map((track, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {track}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainMap
