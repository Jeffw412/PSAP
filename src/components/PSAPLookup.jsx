import { useState } from 'react'
import './PSAPLookup.css'

const PSAPLookup = ({ onLookup, loading }) => {
  const [coordinates, setCoordinates] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (coordinates.trim()) {
      onLookup(coordinates.trim())
    }
  }

  const validateCoordinates = (input) => {
    // Basic validation for GPS coordinates
    // Supports formats like: 40.7128, -74.0060 or 40.7128 N, 74.0060 W
    const patterns = [
      /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/, // Decimal degrees: lat, lon
      /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/, // Decimal degrees with spaces
      /^\d+\.?\d*\s*[NS],?\s*\d+\.?\d*\s*[EW]$/i, // Degrees with cardinal directions
      /^\d+°\d+'?\d*\.?\d*"?\s*[NS],?\s*\d+°\d+'?\d*\.?\d*"?\s*[EW]$/i // DMS format
    ]
    
    return patterns.some(pattern => pattern.test(input.trim()))
  }

  const isValidCoordinates = coordinates ? validateCoordinates(coordinates) : true

  return (
    <div className="psap-lookup">
      <div className="lookup-container">
        <h2>GPS Coordinate Lookup</h2>
        <p className="instruction-text">
          Paste GPS coordinates to locate the PSAP/Emergency Services responsible for responding to geolocation of the emergency.
        </p>
        
        <form onSubmit={handleSubmit} className="lookup-form">
          <div className="input-group">
            <textarea
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              placeholder="Enter GPS coordinates (e.g., 40.7128, -74.0060 or 40.7128 N, 74.0060 W)"
              className={`coordinate-input ${!isValidCoordinates ? 'invalid' : ''}`}
              rows="3"
              disabled={loading}
            />
            {!isValidCoordinates && (
              <div className="validation-error">
                Please enter valid GPS coordinates
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="lookup-button"
            disabled={loading || !coordinates.trim() || !isValidCoordinates}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Looking up PSAP...
              </>
            ) : (
              'Find Emergency Services'
            )}
          </button>
        </form>
        
        <div className="format-examples">
          <h4>Supported coordinate formats:</h4>
          <ul>
            <li>Decimal degrees: <code>40.7128, -74.0060</code></li>
            <li>Cardinal directions: <code>40.7128 N, 74.0060 W</code></li>
            <li>Degrees/Minutes/Seconds: <code>40°42'46.3"N, 74°00'21.6"W</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PSAPLookup
