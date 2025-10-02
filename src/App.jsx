import { useState } from 'react'
import './App.css'
import PSAPLookup from './components/PSAPLookup'
import PSAPResultsPopup from './components/PSAPResultsPopup'
import Login from './components/Login'
import ThemeToggle from './components/ThemeToggle'
import { lookupPSAP } from './services/psapService'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Main App Component that handles PSAP functionality
const PSAPApp = () => {
  const [psapData, setPsapData] = useState(null)
  const [searchCoordinates, setSearchCoordinates] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const { user, logout } = useAuth()

  const handlePSAPLookup = async (coordinates) => {
    setLoading(true)
    setError(null)
    setPsapData(null)
    setShowPopup(false)

    try {
      // Call PSAP service to get information
      const data = await lookupPSAP(coordinates)
      setPsapData(data)
      setSearchCoordinates(coordinates)
      setShowPopup(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-header-content">
          <img src="/global-rescue-logo.png" alt="Global Rescue" className="logo" />
          <h1>PSAP AI</h1>
          <p>Emergency Response Services Locator</p>
          <p className="subtitle">Global Rescue Operations</p>
        </div>
        <div className="App-header-controls">
          <ThemeToggle />
          <button onClick={handleLogout} className="logout-button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="App-main">
        <PSAPLookup
          onLookup={handlePSAPLookup}
          loading={loading}
        />

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {showPopup && psapData && (
          <PSAPResultsPopup
            data={psapData}
            coordinates={searchCoordinates}
            onClose={handleClosePopup}
          />
        )}
      </main>
    </div>
  )
}

// Auth-aware App Component
const AuthenticatedApp = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="App" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return user ? <PSAPApp /> : <Login />
}

// Root App Component with Providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
