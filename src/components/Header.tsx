import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Train, 
  Brain, 
  ChartBar, 
  Map, 
  Cog,
  Wifi,
  WifiOff
} from './SimpleIcons'

interface HeaderProps {
  isConnected: boolean
}

const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: ChartBar },
    { path: '/decisions', label: 'AI Decisions', icon: Brain },
    { path: '/predictions', label: 'ML Predictions', icon: Brain },
    { path: '/optimizer', label: 'Optimizer', icon: Cog },
    { path: '/analytics', label: 'Analytics', icon: ChartBar },
    { path: '/map', label: 'Train Map', icon: Map },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Train className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Junction Genius</h1>
              <p className="text-xs text-muted-foreground">AI Railway Control</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
