import './PSAPResults.css'

const PSAPResults = ({ data, onFindNearby }) => {
  if (!data) return null

  const {
    psapName,
    psapWebsite,
    phoneNumbers = [],
    address,
    jurisdictionArea,
    emergencyServices = [],
    additionalInfo,
    rawResponse
  } = data

  // Function to render the raw response with proper line breaks and styling
  const renderFormattedResponse = (text) => {
    if (!text) return null

    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return null

      // Determine the type of line for styling
      let lineClass = 'response-line'
      let content = trimmedLine

      if (trimmedLine.startsWith('PSAP:')) {
        lineClass += ' psap-line'
        const psapName = trimmedLine.replace('PSAP:', '').trim()
        content = (
          <>
            <span className="label">PSAP:</span>
            <span className="value">
              {psapWebsite ? (
                <a
                  href={psapWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="psap-name-link"
                >
                  {psapName}
                </a>
              ) : (
                psapName
              )}
            </span>
          </>
        )
      } else if (trimmedLine.startsWith('PSAP Website:')) {
        // Skip rendering the website line - it's embedded in the PSAP name
        return null
      } else if (trimmedLine.startsWith('Phone:')) {
        lineClass += ' phone-line'
        const phoneNumber = trimmedLine.replace('Phone:', '').trim()
        content = (
          <>
            <span className="label">Phone:</span>
            <a href={`tel:${phoneNumber}`} className="phone-link value">
              {phoneNumber}
            </a>
          </>
        )
      } else if (trimmedLine.startsWith('Jurisdiction:')) {
        lineClass += ' jurisdiction-line'
        content = (
          <>
            <span className="label">Jurisdiction:</span>
            <span className="value">{trimmedLine.replace('Jurisdiction:', '').trim()}</span>
          </>
        )
      }

      return (
        <div key={index} className={lineClass}>
          {content}
        </div>
      )
    }).filter(Boolean)
  }

  return (
    <div className="psap-results">
      <div className="results-container">
        <h2>Emergency Services Information</h2>

        <div className="psap-card">
          <div className="psap-header">
            <h3 className="psap-name">
              {psapWebsite ? (
                <a
                  href={psapWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="psap-website-link"
                >
                  {psapName || 'PSAP Information'}
                </a>
              ) : (
                psapName || 'PSAP Information'
              )}
            </h3>
            <div className="emergency-badge">Emergency Services</div>
          </div>

          <div className="psap-details">
            {/* Display the formatted response from ChatGPT Assistant */}
            {rawResponse && (
              <div className="detail-section">
                <h4>PSAP Details</h4>
                <div className="formatted-response">
                  {renderFormattedResponse(rawResponse)}
                </div>
              </div>
            )}

            {/* Fallback to structured display if no raw response */}
            {!rawResponse && (
              <>
                {phoneNumbers && phoneNumbers.length > 0 && (
                  <div className="detail-section">
                    <h4>Emergency Contact Numbers</h4>
                    <div className="phone-numbers">
                      {phoneNumbers.map((phone, index) => (
                        <div key={index} className="phone-item">
                          <span className="phone-label">{phone.type || 'Emergency'}:</span>
                          <a href={`tel:${phone.number}`} className="phone-number">
                            {phone.number}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {jurisdictionArea && (
                  <div className="detail-section">
                    <h4>Jurisdiction Area</h4>
                    <div className="jurisdiction">
                      <p>{jurisdictionArea}</p>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="detail-section">
                    <h4>Address</h4>
                    <div className="address">
                      {typeof address === 'string' ? (
                        <p>{address}</p>
                      ) : (
                        <div>
                          {address.street && <p>{address.street}</p>}
                          {address.city && address.state && (
                            <p>{address.city}, {address.state} {address.zipCode}</p>
                          )}
                          {address.country && <p>{address.country}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {emergencyServices && emergencyServices.length > 0 && (
                  <div className="detail-section">
                    <h4>Available Emergency Services</h4>
                    <div className="services-list">
                      {emergencyServices.map((service, index) => (
                        <span key={index} className="service-tag">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {additionalInfo && (
                  <div className="detail-section">
                    <h4>Additional Information</h4>
                    <div className="additional-info">
                      <p>{additionalInfo}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Nearby PSAPs Button */}
        <div className="nearby-psaps-section">
          <button
            className="nearby-psaps-button"
            onClick={onFindNearby}
            aria-label="Find nearby PSAPs"
          >
            <span className="button-icon">🔍</span>
            <span className="button-text">Find Nearby PSAPs</span>
            <span className="button-subtitle">In case this PSAP doesn't answer</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PSAPResults
