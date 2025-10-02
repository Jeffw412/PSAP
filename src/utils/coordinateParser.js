/**
 * Utility functions for parsing GPS coordinates from various formats
 * Supports decimal degrees, cardinal directions, and DMS formats
 */

/**
 * Parse coordinates from string input into decimal lat/lng
 * @param {string} coordinateString - The coordinate string to parse
 * @returns {Object|null} - {lat: number, lng: number} or null if parsing fails
 */
export const parseCoordinates = (coordinateString) => {
  if (!coordinateString || typeof coordinateString !== 'string') {
    return null
  }

  const coordStr = coordinateString.trim()

  // Try different parsing methods in order of complexity
  return (
    parseDecimalDegrees(coordStr) ||
    parseCardinalDirections(coordStr) ||
    parseDMS(coordStr)
  )
}

/**
 * Parse decimal degrees format: "40.7128, -74.0060"
 */
const parseDecimalDegrees = (coordStr) => {
  const decimalPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
  const match = coordStr.match(decimalPattern)
  
  if (match) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    
    if (isValidLatitude(lat) && isValidLongitude(lng)) {
      return { lat, lng }
    }
  }
  
  return null
}

/**
 * Parse cardinal directions format: "40.7128 N, 74.0060 W"
 */
const parseCardinalDirections = (coordStr) => {
  const cardinalPattern = /^(\d+\.?\d*)\s*([NS]),?\s*(\d+\.?\d*)\s*([EW])$/i
  const match = coordStr.match(cardinalPattern)
  
  if (match) {
    let lat = parseFloat(match[1])
    const latDir = match[2].toUpperCase()
    let lng = parseFloat(match[3])
    const lngDir = match[4].toUpperCase()
    
    // Apply direction signs
    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng
    
    if (isValidLatitude(lat) && isValidLongitude(lng)) {
      return { lat, lng }
    }
  }
  
  return null
}

/**
 * Parse DMS (Degrees, Minutes, Seconds) format: "40°42'46.3"N, 74°00'21.6"W"
 */
const parseDMS = (coordStr) => {
  const dmsPattern = /^(\d+)°(\d+)'?(\d*\.?\d*)"?\s*([NS]),?\s*(\d+)°(\d+)'?(\d*\.?\d*)"?\s*([EW])$/i
  const match = coordStr.match(dmsPattern)
  
  if (match) {
    const latDeg = parseInt(match[1])
    const latMin = parseInt(match[2])
    const latSec = parseFloat(match[3]) || 0
    const latDir = match[4].toUpperCase()
    
    const lngDeg = parseInt(match[5])
    const lngMin = parseInt(match[6])
    const lngSec = parseFloat(match[7]) || 0
    const lngDir = match[8].toUpperCase()
    
    // Convert DMS to decimal degrees
    let lat = latDeg + (latMin / 60) + (latSec / 3600)
    let lng = lngDeg + (lngMin / 60) + (lngSec / 3600)
    
    // Apply direction signs
    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng
    
    if (isValidLatitude(lat) && isValidLongitude(lng)) {
      return { lat, lng }
    }
  }
  
  return null
}

/**
 * Validate latitude is within valid range
 */
const isValidLatitude = (lat) => {
  return typeof lat === 'number' && lat >= -90 && lat <= 90
}

/**
 * Validate longitude is within valid range
 */
const isValidLongitude = (lng) => {
  return typeof lng === 'number' && lng >= -180 && lng <= 180
}

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat, lng) => {
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return 'Invalid coordinates'
  }
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
