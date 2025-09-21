import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Train, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Brain,
  Settings
} from './SimpleIcons'

interface TrainStatus {
  id: string
  name: string
  status: 'on-time' | 'delayed' | 'early'
  delay: number
  route: string
}

interface AIDecision {
  id: string
  type: string
  description: string
  confidence: number
  status: 'pending' | 'accepted' | 'rejected'
  timeSaving: number
}

const Dashboard: React.FC = () => {
  const [trainStatuses, setTrainStatuses] = useState<TrainStatus[]>([])
  const [aiDecisions, setAiDecisions] = useState<AIDecision[]>([])
  const [stats, setStats] = useState({
    totalTrains: 0,
    onTimeTrains: 0,
    delayedTrains: 0,
    pendingDecisions: 0,
    timeSaved: 0
  })

  useEffect(() => {
    // Fetch train statuses
    const fetchTrainStatuses = async () => {
      try {
        const response = await fetch('http://localhost:8000/mlpredictions')
        if (response.ok) {
          const data = await response.json()
          const trains = data.predictions.map((pred: any) => ({
            id: pred.trainId,
            name: pred.trainId,
            status: pred.predictedDelay > 10 ? 'delayed' : 'on-time',
            delay: pred.predictedDelay,
            route: 'Route A'
          }))
          setTrainStatuses(trains)
        }
      } catch (error) {
        console.error('Failed to fetch train statuses:', error)
      }
    }

    // Fetch AI decisions
    const fetchAIDecisions = async () => {
      try {
        const response = await fetch('http://localhost:8000/aidecisions')
        if (response.ok) {
          const data = await response.json()
          setAiDecisions(data.decisions)
        }
      } catch (error) {
        console.error('Failed to fetch AI decisions:', error)
      }
    }

    fetchTrainStatuses()
    fetchAIDecisions()

    // Update stats
    setStats({
      totalTrains: trainStatuses.length,
      onTimeTrains: trainStatuses.filter(t => t.status === 'on-time').length,
      delayedTrains: trainStatuses.filter(t => t.status === 'delayed').length,
      pendingDecisions: aiDecisions.filter(d => d.status === 'pending').length,
      timeSaved: aiDecisions.reduce((sum, d) => sum + d.timeSaving, 0)
    })
  }, [trainStatuses.length, aiDecisions.length])

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
      case 'early': return <TrendingUp className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Railway Control Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and AI-powered decision support</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trains</CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrains}</div>
            <p className="text-xs text-muted-foreground">Active trains in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.onTimeTrains}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTrains > 0 ? Math.round((stats.onTimeTrains / stats.totalTrains) * 100) : 0}% on-time rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.delayedTrains}</div>
            <p className="text-xs text-muted-foreground">Trains experiencing delays</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.timeSaved}</div>
            <p className="text-xs text-muted-foreground">Minutes saved by AI decisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Train Status */}
        <Card>
          <CardHeader>
            <CardTitle>Train Status</CardTitle>
            <CardDescription>Current status of all trains in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainStatuses.map((train) => (
                <div key={train.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(train.status)}`} />
                    <div>
                      <p className="font-medium">{train.name}</p>
                      <p className="text-sm text-muted-foreground">{train.route}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(train.status)}
                    <Badge variant={train.status === 'delayed' ? 'destructive' : 'secondary'}>
                      {train.delay > 0 ? `+${train.delay}m` : 'On Time'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Decisions */}
        <Card>
          <CardHeader>
            <CardTitle>AI Decisions</CardTitle>
            <CardDescription>Pending AI recommendations requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiDecisions.slice(0, 3).map((decision) => (
                <div key={decision.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{decision.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {decision.type} • {Math.round(decision.confidence * 100)}% confidence
                      </p>
                    </div>
                    <Badge variant={decision.status === 'pending' ? 'default' : 'secondary'}>
                      {decision.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-green-600">
                      Saves {decision.timeSaving} minutes
                    </span>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">Accept</Button>
                      <Button size="sm" variant="outline">Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
