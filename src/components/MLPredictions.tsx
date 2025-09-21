import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Train, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface MLPrediction {
  trainId: string
  predictedDelay: number
  confidence: number
  factors: string[]
  recommendation: string
}

const MLPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<MLPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [newPrediction, setNewPrediction] = useState({
    train_id: 'EXP-101',
    weather: 0.0,
    traffic_density: 0.0,
    hour: 12,
    day_of_week: 0,
    track_condition: 1.0,
    signal_delay: 0.0,
    platform_availability: 1.0,
    route_complexity: 1,
    train_type: 'Express',
    current_delay: 0.0
  })

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch('http://localhost:8000/mlpredictions')
        if (response.ok) {
          const data = await response.json()
          setPredictions(data.predictions)
        }
      } catch (error) {
        console.error('Failed to fetch ML predictions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [])

  const handleNewPrediction = async () => {
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrediction)
      })

      if (response.ok) {
        const data = await response.json()
        const prediction = data.prediction
        
        // Add to predictions list
        setPredictions(prev => [{
          trainId: prediction.train_id,
          predictedDelay: prediction.predicted_delay,
          confidence: prediction.confidence,
          factors: prediction.factors,
          recommendation: prediction.recommendation
        }, ...prev])
      }
    } catch (error) {
      console.error('Failed to get new prediction:', error)
    }
  }

  const getDelayColor = (delay: number) => {
    if (delay < 5) return 'text-green-500'
    if (delay < 15) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getDelayIcon = (delay: number) => {
    if (delay < 5) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (delay < 15) return <Clock className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading ML predictions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Predictions</h1>
          <p className="text-muted-foreground">AI-powered delay predictions and routing recommendations</p>
        </div>
        <Button onClick={handleNewPrediction}>
          <Brain className="h-4 w-4 mr-2" />
          New Prediction
        </Button>
      </div>

      {/* New Prediction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Prediction</CardTitle>
          <CardDescription>Input parameters to get a new ML prediction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Train ID</label>
              <input
                type="text"
                value={newPrediction.train_id}
                onChange={(e) => setNewPrediction(prev => ({ ...prev, train_id: e.target.value }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Weather (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={newPrediction.weather}
                onChange={(e) => setNewPrediction(prev => ({ ...prev, weather: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Traffic Density (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={newPrediction.traffic_density}
                onChange={(e) => setNewPrediction(prev => ({ ...prev, traffic_density: parseFloat(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={newPrediction.hour}
                onChange={(e) => setNewPrediction(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <div className="grid gap-4">
        {predictions.map((prediction, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Train className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{prediction.trainId}</CardTitle>
                    <CardDescription>
                      ML Prediction • {Math.round(prediction.confidence * 100)}% confidence
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getDelayIcon(prediction.predictedDelay)}
                  <Badge variant={prediction.predictedDelay < 5 ? 'default' : 'destructive'}>
                    {prediction.predictedDelay.toFixed(1)}m delay
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Predicted Delay</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getDelayColor(prediction.predictedDelay)}`}>
                      {prediction.predictedDelay.toFixed(1)} minutes
                    </span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Contributing Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {prediction.factors.map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Recommendation</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {prediction.recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {predictions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No ML predictions available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MLPredictions
