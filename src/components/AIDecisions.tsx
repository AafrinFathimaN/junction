import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

interface AIDecision {
  id: string
  type: string
  description: string
  impact: string
  confidence: number
  status: 'pending' | 'accepted' | 'rejected'
  estimatedTimeSaving: number
}

const AIDecisions: React.FC = () => {
  const [decisions, setDecisions] = useState<AIDecision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const response = await fetch('http://localhost:8000/aidecisions')
        if (response.ok) {
          const data = await response.json()
          setDecisions(data.decisions)
        }
      } catch (error) {
        console.error('Failed to fetch AI decisions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDecisions()
  }, [])

  const handleDecision = async (decisionId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:8000/decisions/${decisionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          controller_id: 'controller-001',
          feedback_score: action === 'accept' ? 0.9 : 0.1,
          context: `${action}ed decision`
        })
      })

      if (response.ok) {
        // Update local state
        setDecisions(prev => prev.map(decision => 
          decision.id === decisionId 
            ? { ...decision, status: action === 'accept' ? 'accepted' : 'rejected' }
            : decision
        ))
      }
    } catch (error) {
      console.error(`Failed to ${action} decision:`, error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading AI decisions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Decisions</h1>
          <p className="text-muted-foreground">Review and manage AI-powered recommendations</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline">
            {decisions.filter(d => d.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline">
            {decisions.filter(d => d.status === 'accepted').length} Accepted
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {decisions.map((decision) => (
          <Card key={decision.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(decision.status)}`} />
                  <div>
                    <CardTitle className="text-lg">{decision.description}</CardTitle>
                    <CardDescription className="mt-1">
                      {decision.type} • {Math.round(decision.confidence * 100)}% confidence
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(decision.status)}
                  <Badge variant={decision.status === 'pending' ? 'default' : 'secondary'}>
                    {decision.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Impact Analysis</h4>
                  <p className="text-sm text-muted-foreground">{decision.impact}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Saves {decision.estimatedTimeSaving} minutes
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-600">
                        {Math.round(decision.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  {decision.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleDecision(decision.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDecision(decision.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {decisions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No AI decisions available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AIDecisions
