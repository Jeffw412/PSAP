import { useEffect, useRef, useState } from 'react'
import './GoogleMap.css'

const GoogleMap = ({ latitude, longitude, title = "Incident Location" }) => {
  const mapRef = useRef(null)
  const [mapError, setMapError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if coordinates are valid
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setMapError('Invalid coordinates provided')
      setIsLoading(false)
      return
    }

    // Check if Google Maps API is loaded
    if (typeof window.google === 'undefined') {
      setMapError('Google Maps API not loaded')
      setIsLoading(false)
      return
    }

    // Add error handler for Google Maps API errors
    window.gm_authFailure = () => {
      setMapError('Google Maps API authentication failed. Please check the API key configuration.')
      setIsLoading(false)
    }

    // Wait for the map container to be properly mounted
    if (!mapRef.current) {
      setMapError('Map container not ready')
      setIsLoading(false)
      return
    }

    // Use a timeout to ensure the DOM is fully ready
    const initializeMap = () => {
      try {
        // Double-check that the map container exists and is in the DOM
        if (!mapRef.current || !document.contains(mapRef.current)) {
          setMapError('Map container not available')
          setIsLoading(false)
          return
        }

        // Initialize the map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        })

        // Add a marker for the incident location
        const marker = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
          title: title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="4" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        })

        // Add an info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">${title}</h4>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </p>
            </div>
          `
        })

        // Show info window when marker is clicked
        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })

        // Auto-open info window after a short delay
        setTimeout(() => {
          infoWindow.open(map, marker)
        }, 500)

        setIsLoading(false)
        setMapError(null)

      } catch (error) {
        console.error('Error initializing Google Map:', error)
        setMapError('Failed to load map')
        setIsLoading(false)
      }
    }

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(initializeMap, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [latitude, longitude, title])

  if (mapError) {
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

    return (
      <div className="map-container">
        <div className="map-error">
          <div className="error-icon">🗺️</div>
          <h4>Map Unavailable</h4>
          <p>Unable to load interactive map</p>
          <div className="coordinates-fallback">
            <strong>Coordinates:</strong> {latitude}, {longitude}
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-link"
          >
            View on Google Maps
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="map-container">
      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading map...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="google-map"
        style={{ 
          width: '100%', 
          height: '300px',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  )
}

export default GoogleMap
