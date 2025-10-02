import { useEffect, useState } from 'react'
import PSAPResults from './PSAPResults'
import NearbyPSAPResults from './NearbyPSAPResults'
import GoogleMap from './GoogleMap'
import { parseCoordinates, formatCoordinates } from '../utils/coordinateParser'
import { lookupNearbyPSAPs } from '../services/psapService'
import './PSAPResultsPopup.css'

const PSAPResultsPopup = ({ data, coordinates, onClose }) => {
  const [showNearby, setShowNearby] = useState(false)
  const [nearbyPSAPs, setNearbyPSAPs] = useState(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)
  // Parse coordinates for the map
  const parsedCoords = parseCoordinates(coordinates)

  // Handle finding nearby PSAPs
  const handleFindNearby = async () => {
    setNearbyLoading(true)
    setNearbyError(null)

    try {
      const nearbyData = await lookupNearbyPSAPs(coordinates)
      setNearbyPSAPs(nearbyData)
      setShowNearby(true)
    } catch (error) {
      console.error('Error finding nearby PSAPs:', error)
      setNearbyError('Failed to find nearby PSAPs. Please try again.')
    } finally {
      setNearbyLoading(false)
    }
  }

  // Handle going back to primary PSAP
  const handleBackToPrimary = () => {
    setShowNearby(false)
    setNearbyError(null)
  }

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [onClose])

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle backdrop click to close popup
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!data) return null

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-container">
        <div className="popup-header">
          <h2>{showNearby ? 'Nearby Emergency Services' : 'Emergency Services Information'}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <div className="popup-content">
          {/* Map Section - only show for primary PSAP */}
          {!showNearby && (
            <div className="map-section">
              <h3>Incident Location</h3>
              {parsedCoords ? (
                <>
                  <GoogleMap
                    latitude={parsedCoords.lat}
                    longitude={parsedCoords.lng}
                    title="Emergency Incident Location"
                  />
                  <div className="coordinates-display">
                    <strong>Coordinates:</strong> {formatCoordinates(parsedCoords.lat, parsedCoords.lng)}
                  </div>
                </>
              ) : (
                <div className="coordinates-error">
                  <div className="error-icon">📍</div>
                  <h4>Unable to display map</h4>
                  <p>Could not parse coordinates: {coordinates}</p>
                </div>
              )}
            </div>
          )}

          {/* PSAP Results Section */}
          <div className="results-section">
            {showNearby ? (
              <NearbyPSAPResults
                psaps={nearbyPSAPs}
                onBack={handleBackToPrimary}
              />
            ) : (
              <PSAPResults
                data={data}
                onFindNearby={nearbyLoading ? null : handleFindNearby}
              />
            )}

            {/* Loading state for nearby search */}
            {nearbyLoading && (
              <div className="nearby-loading">
                <div className="loading-spinner"></div>
                <p>Searching for nearby PSAPs...</p>
              </div>
            )}

            {/* Error state for nearby search */}
            {nearbyError && (
              <div className="nearby-error">
                <p>{nearbyError}</p>
                <button onClick={handleFindNearby} className="retry-button">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PSAPResultsPopup
