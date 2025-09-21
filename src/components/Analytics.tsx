import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Brain, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AnalyticsData {
  total_decisions: number
  acceptance_rate: number
  average_feedback_score: number
  decision_types: Record<string, number>
  hourly_patterns: Record<string, number>
}

interface ModelPerformance {
  total_feedback_records: number
  average_feedback_score: number
  average_prediction_error: number
  model_type: string
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [modelPerformance, setModelPerformance] = useState<{
    delay_prediction: ModelPerformance
    routing: ModelPerformance
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/performance')
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data.overall_stats)
          setModelPerformance({
            delay_prediction: data.delay_prediction,
            routing: data.routing
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Performance</h1>
          <p className="text-muted-foreground">System performance metrics and AI model analytics</p>
        </div>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Stats */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.total_decisions}</div>
              <p className="text-xs text-muted-foreground">AI decisions processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {Math.round(analyticsData.acceptance_rate * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Decisions accepted by controllers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Feedback Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {analyticsData.average_feedback_score.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Out of 1.0 scale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decision Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {Object.keys(analyticsData.decision_types).length}
              </div>
              <p className="text-xs text-muted-foreground">Different decision categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Types Breakdown */}
        {analyticsData && (
          <Card>
            <CardHeader>
              <CardTitle>Decision Types Distribution</CardTitle>
              <CardDescription>Breakdown of AI decision categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.decision_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count} decisions</span>
                      <Badge variant="outline">
                        {analyticsData.total_decisions > 0 
                          ? Math.round((count / analyticsData.total_decisions) * 100) 
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Patterns */}
        {analyticsData && (
          <Card>
            <CardHeader>
              <CardTitle>Decision Activity by Hour</CardTitle>
              <CardDescription>Peak hours for AI decision requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analyticsData.hourly_patterns)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([hour, count]) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{hour}:00</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.max(10, (count / Math.max(...Object.values(analyticsData.hourly_patterns))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Model Performance */}
      {modelPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Delay Prediction Model</span>
              </CardTitle>
              <CardDescription>Performance metrics for delay prediction AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feedback Records</span>
                  <Badge variant="outline">
                    {modelPerformance.delay_prediction.total_feedback_records}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score</span>
                  <Badge variant="outline">
                    {modelPerformance.delay_prediction.average_feedback_score.toFixed(3)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prediction Error</span>
                  <Badge variant="outline">
                    {modelPerformance.delay_prediction.average_prediction_error.toFixed(2)} min
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Routing Model</span>
              </CardTitle>
              <CardDescription>Performance metrics for routing optimization AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feedback Records</span>
                  <Badge variant="outline">
                    {modelPerformance.routing.total_feedback_records}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score</span>
                  <Badge variant="outline">
                    {modelPerformance.routing.average_feedback_score.toFixed(3)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prediction Error</span>
                  <Badge variant="outline">
                    {modelPerformance.routing.average_prediction_error.toFixed(2)} min
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700">High Acceptance Rate</span>
              </div>
              <p className="text-sm text-green-600">
                {analyticsData && analyticsData.acceptance_rate > 0.7 
                  ? "Controllers are accepting most AI recommendations, indicating high trust in the system."
                  : "Consider reviewing AI decision quality to improve acceptance rates."
                }
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-700">Model Performance</span>
              </div>
              <p className="text-sm text-blue-600">
                {modelPerformance && modelPerformance.delay_prediction.average_feedback_score > 0.8
                  ? "AI models are performing well with high feedback scores."
                  : "AI models may benefit from additional training data."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics
