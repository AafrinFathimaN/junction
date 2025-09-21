import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Components
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AIDecisions from './components/AIDecisions'
import MLPredictions from './components/MLPredictions'
import ScheduleOptimizer from './components/ScheduleOptimizer'
import Analytics from './components/Analytics'
import TrainMap from './components/TrainMap'

// Create a client
const queryClient = new QueryClient()

function App() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check backend connection
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/')
        if (response.ok) {
          setIsConnected(true)
        }
      } catch (error) {
        console.warn('Backend not connected:', error)
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Router>
          <div className="min-h-screen bg-background">
            <Header isConnected={isConnected} />
            
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/decisions" element={<AIDecisions />} />
                <Route path="/predictions" element={<MLPredictions />} />
                <Route path="/optimizer" element={<ScheduleOptimizer />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/map" element={<TrainMap />} />
              </Routes>
            </main>

            <Toaster position="top-right" />
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
