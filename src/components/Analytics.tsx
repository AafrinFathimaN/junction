import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Brain, Clock, CheckCircle, XCircle, Activity, Target, Zap } from 'lucide-react'

interface PerformanceAnalytics {
  sandbox_efficiency: {
    total_simulations: number
    average_efficiency_score: number
    total_delays_avoided: number
    total_conflicts_resolved: number
    average_punctuality_rate: number
    recommendations: string[]
  }
  decision_success_rate: {
    total_decisions: number
    acceptance_rate: number
    average_feedback_score: number
    decision_types: Record<string, number>
  }
  train_punctuality: {
    current_punctuality_rate: number
    punctuality_trend: string
    delay_prediction_accuracy: number
    routing_optimization_score: number
  }
  overall_system_health: {
    status: string
    efficiency_score: number
    key_metrics: {
      ai_acceptance_rate: number
      punctuality_rate: number
      conflicts_resolved_rate: number
    }
  }
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/performance')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data.analytics)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      default: return 'text-yellow-500'
    }
  }

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
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(analytics.overall_system_health.status)}`}>
                {analytics.overall_system_health.status.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.overall_system_health.efficiency_score.toFixed(1)}% efficiency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punctuality Rate</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {Math.round(analytics.train_punctuality.current_punctuality_rate * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Trend: {analytics.train_punctuality.punctuality_trend}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Acceptance</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(analytics.decision_success_rate.acceptance_rate * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.decision_success_rate.total_decisions} total decisions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delays Avoided</CardTitle>
              <Zap className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {analytics.sandbox_efficiency.total_delays_avoided}
              </div>
              <p className="text-xs text-muted-foreground">
                Minutes saved by AI optimization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sandbox Efficiency */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Sandbox Simulation Results</CardTitle>
            <CardDescription>Performance metrics from scenario simulations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.sandbox_efficiency.total_simulations}
                </div>
                <div className="text-sm text-green-600">Total Simulations</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.sandbox_efficiency.average_efficiency_score.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-600">Average Efficiency</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.sandbox_efficiency.total_conflicts_resolved}
                </div>
                <div className="text-sm text-purple-600">Conflicts Resolved</div>
              </div>
            </div>
            
            {analytics.sandbox_efficiency.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">AI Recommendations</h4>
                <div className="space-y-2">
                  {analytics.sandbox_efficiency.recommendations.map((rec, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Types Breakdown */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Decision Types Distribution</CardTitle>
              <CardDescription>Breakdown of AI decision categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.decision_success_rate.decision_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count} decisions</span>
                      <Badge variant="outline">
                        {analytics.decision_success_rate.total_decisions > 0 
                          ? Math.round((count / analytics.decision_success_rate.total_decisions) * 100) 
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Critical system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Acceptance Rate</span>
                  <Badge variant="outline">
                    {Math.round(analytics.overall_system_health.key_metrics.ai_acceptance_rate * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Punctuality Rate</span>
                  <Badge variant="outline">
                    {Math.round(analytics.overall_system_health.key_metrics.punctuality_rate * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conflicts Resolved Rate</span>
                  <Badge variant="outline">
                    {analytics.overall_system_health.key_metrics.conflicts_resolved_rate.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Insights */}
      {analytics && (
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
                <span className="font-medium text-green-700">System Performance</span>
              </div>
              <p className="text-sm text-green-600">
                {analytics.overall_system_health.status === 'excellent'
                  ? "System is performing excellently with high efficiency and punctuality rates."
                  : "System performance is good but has room for improvement in key areas."
                }
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-700">AI Optimization</span>
              </div>
              <p className="text-sm text-blue-600">
                {analytics.sandbox_efficiency.average_efficiency_score > 70
                  ? "AI optimization is highly effective in reducing delays and conflicts."
                  : "AI optimization shows potential but may need fine-tuning for better results."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

export default Analytics
