import './NearbyPSAPResults.css'

const NearbyPSAPResults = ({ psaps, onBack }) => {
  if (!psaps || psaps.length === 0) return null

  // Function to render the raw response with proper line breaks and styling
  const renderFormattedResponse = (text, psap) => {
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
              {psap.psapWebsite ? (
                <a
                  href={psap.psapWebsite}
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
    <div className="nearby-psap-results">
      <div className="results-container">
        <div className="results-header">
          <button className="back-button" onClick={onBack} aria-label="Back to primary PSAP">
            ← Back to Primary PSAP
          </button>
          <h2>Nearby Emergency Services</h2>
          <p className="results-subtitle">
            Alternative PSAPs and dispatch centers in case the primary PSAP is unavailable
          </p>
        </div>

        <div className="psap-list">
          {psaps.map((psap, index) => (
            <div key={index} className={`psap-card ${index === 0 ? 'primary-psap' : 'backup-psap'}`}>
              <div className="psap-header">
                <h3 className="psap-name">
                  {psap.psapWebsite ? (
                    <a
                      href={psap.psapWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="psap-website-link"
                    >
                      {psap.psapName || 'PSAP Information'}
                    </a>
                  ) : (
                    psap.psapName || 'PSAP Information'
                  )}
                </h3>
                <div className={`psap-badge ${index === 0 ? 'primary-badge' : 'backup-badge'}`}>
                  {index === 0 ? 'Primary' : `Backup ${index}`}
                </div>
              </div>

              <div className="psap-details">
                {/* Display the formatted response from ChatGPT Assistant */}
                {psap.rawResponse && (
                  <div className="detail-section">
                    <div className="formatted-response">
                      {renderFormattedResponse(psap.rawResponse, psap)}
                    </div>
                  </div>
                )}

                {/* Fallback to structured display if no raw response */}
                {!psap.rawResponse && (
                  <>
                    {psap.phoneNumbers && psap.phoneNumbers.length > 0 && (
                      <div className="detail-section">
                        <h4>Emergency Contact Numbers</h4>
                        <div className="phone-numbers">
                          {psap.phoneNumbers.map((phone, phoneIndex) => (
                            <div key={phoneIndex} className="phone-item">
                              <span className="phone-label">{phone.type || 'Emergency'}:</span>
                              <a href={`tel:${phone.number}`} className="phone-number">
                                {phone.number}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {psap.jurisdictionArea && (
                      <div className="detail-section">
                        <h4>Jurisdiction Area</h4>
                        <div className="jurisdiction">
                          <p>{psap.jurisdictionArea}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button className="back-button-large" onClick={onBack}>
            ← Return to Primary PSAP
          </button>
        </div>
      </div>
    </div>
  )
}

export default NearbyPSAPResults
