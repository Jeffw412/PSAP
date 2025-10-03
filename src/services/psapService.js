// PSAP Service for handling Google AI Studio (Gemini) API calls directly from frontend
// For internal tool use - API keys are hardcoded for simplicity

import { GoogleGenAI } from '@google/genai'

// Google AI Studio Configuration
const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'your-google-ai-api-key-here'

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY })

// Retry configuration for frontend calls
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffFactor: 2
}

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Check if error is retryable
const isRetryableError = (error) => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true
  if (error.message.includes('network')) return true
  if (error.message.includes('timeout')) return true

  // HTTP status codes that are retryable
  const retryableStatusCodes = [429, 500, 502, 503, 504]
  if (error.status && retryableStatusCodes.includes(error.status)) return true

  return false
}

// Exponential backoff retry function
const retryWithBackoff = async (fn, retries = RETRY_CONFIG.maxRetries) => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxRetries - retries),
        RETRY_CONFIG.maxDelay
      )

      console.warn(`Retrying in ${delay}ms. Retries left: ${retries}. Error: ${error.message}`)
      await sleep(delay)
      return retryWithBackoff(fn, retries - 1)
    }
    throw error
  }
}

// PSAP lookup prompt template
const createPSAPLookupPrompt = (coordinates) => {
  return `You are a Public Safety Answering Point (PSAP) locator assistant. A PSAP is a facility equipped to receive and process emergency calls (911 in the US). Your task is to find the specific PSAP that serves the given GPS coordinates.

GPS Coordinates: ${coordinates}

Please provide accurate, real information about the PSAP that serves this location. Return the information in this EXACT format:

PSAP: [Official PSAP Name]
PSAP Website: [Official website URL if available]
Phone: [Dispatch/Non-emergency number(s)]
Jurisdiction: [Areas/regions served]

Important requirements:
- Provide only real, accurate information - no fictional or placeholder data
- Use the exact format shown above
- Include the official PSAP name, not just the city or county name
- Provide DISPATCH or NON-EMERGENCY phone numbers, NOT 911 or administrative numbers
- If multiple dispatch/non-emergency numbers exist, list them separated by commas
- If no website is available, you may omit the "PSAP Website:" line
- Be specific about the jurisdiction areas served

Example format:
PSAP: Metro Emergency Communications Center
PSAP Website: https://example-metro-911.gov
Phone: (555) 123-4567, (555) 123-4568
Jurisdiction: Downtown Metro Area, East District, West District`
}

// Nearby PSAPs lookup prompt template
const createNearbyPSAPsPrompt = (coordinates) => {
  return `You are a Public Safety Answering Point (PSAP) locator assistant. A PSAP is a facility equipped to receive and process emergency calls (911 in the US). Your task is to find multiple PSAPs near the given GPS coordinates for backup/alternative emergency response options.

GPS Coordinates: ${coordinates}

Please provide accurate, real information about 3-5 PSAPs that serve areas near this location. Return the information for each PSAP in this EXACT format:

PSAP: [Official PSAP Name]
PSAP Website: [Official website URL if available]
Phone: [Dispatch/Non-emergency number(s)]
Jurisdiction: [Areas/regions served]

[blank line between each PSAP]

Important requirements:
- Provide only real, accurate information - no fictional or placeholder data
- Use the exact format shown above for each PSAP
- Include official PSAP names, not just city or county names
- Provide DISPATCH or NON-EMERGENCY phone numbers, NOT 911 or administrative numbers
- If multiple dispatch/non-emergency numbers exist for a PSAP, list them separated by commas
- If no website is available, you may omit the "PSAP Website:" line
- Be specific about jurisdiction areas served
- Separate each PSAP with a blank line

Example format:
PSAP: Metro Emergency Communications Center
PSAP Website: https://example-metro-911.gov
Phone: (555) 123-4567, (555) 123-4568
Jurisdiction: Downtown Metro Area, East District

PSAP: County Emergency Services
Phone: (555) 987-6543, (555) 987-6544
Jurisdiction: Rural County Areas, Suburban Districts`
}



// Parse multiple PSAPs from the nearby search response
const parseMultiplePSAPResponse = (responseText) => {
  const psaps = []
  const sections = responseText.split(/\n\s*\n/).filter(section => section.trim())

  sections.forEach(section => {
    const lines = section.split('\n').filter(line => line.trim())
    const psap = {
      psapName: '',
      psapWebsite: '',
      phoneNumbers: [],
      jurisdictionArea: '',
      rawResponse: section.trim()
    }

    lines.forEach(line => {
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith('PSAP:')) {
        psap.psapName = trimmedLine.replace('PSAP:', '').trim()
      } else if (trimmedLine.startsWith('PSAP Website:')) {
        psap.psapWebsite = trimmedLine.replace('PSAP Website:', '').trim()
      } else if (trimmedLine.startsWith('Phone:')) {
        const phoneNumber = trimmedLine.replace('Phone:', '').trim()
        psap.phoneNumbers.push({
          type: 'Emergency',
          number: phoneNumber
        })
      } else if (trimmedLine.startsWith('Jurisdiction:')) {
        psap.jurisdictionArea = trimmedLine.replace('Jurisdiction:', '').trim()
      }
    })

    // Only add PSAPs that have at least a name
    if (psap.psapName) {
      psaps.push(psap)
    }
  })

  return psaps
}



// Parse the formatted response from the ChatGPT Assistant
const parsePSAPResponse = (responseText) => {
  const lines = responseText.split('\n').filter(line => line.trim())
  const result = {
    psapName: '',
    psapWebsite: '',
    phoneNumbers: [],
    jurisdictionArea: '',
    rawResponse: responseText
  }

  lines.forEach(line => {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('PSAP:')) {
      result.psapName = trimmedLine.replace('PSAP:', '').trim()
    } else if (trimmedLine.startsWith('PSAP Website:')) {
      result.psapWebsite = trimmedLine.replace('PSAP Website:', '').trim()
    } else if (trimmedLine.startsWith('Phone:')) {
      const phoneNumbersText = trimmedLine.replace('Phone:', '').trim()
      // Handle multiple phone numbers separated by commas
      const phoneNumbers = phoneNumbersText.split(',').map(num => num.trim()).filter(num => num)
      phoneNumbers.forEach(phoneNumber => {
        result.phoneNumbers.push({
          type: 'Dispatch/Non-Emergency',
          number: phoneNumber
        })
      })
    } else if (trimmedLine.startsWith('Jurisdiction:')) {
      result.jurisdictionArea = trimmedLine.replace('Jurisdiction:', '').trim()
    }
  })

  return result
}

// Function to lookup nearby PSAPs for backup/alternative options
export const lookupNearbyPSAPs = async (coordinates) => {
  console.log('Starting nearby PSAP lookup for coordinates:', coordinates)

  const callGeminiAPIForNearby = async () => {
    console.log('Calling Google Gemini API for nearby PSAPs...')

    const prompt = createNearbyPSAPsPrompt(coordinates)
    console.log('Generated nearby PSAPs prompt:', prompt)

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    })

    if (!response || !response.text) {
      throw new Error('No response from Gemini API')
    }

    const responseText = response.text
    console.log('Gemini response:', responseText)

    // Parse multiple PSAPs from the response
    const psaps = parseMultiplePSAPResponse(responseText)
    console.log('Parsed nearby PSAPs:', psaps)

    return psaps
  }

  try {
    const result = await retryWithBackoff(callGeminiAPIForNearby)
    console.log('Nearby PSAP lookup successful:', result)
    return result
  } catch (error) {
    console.error('Error calling Gemini API for nearby PSAPs:', error)
    throw new Error(`Failed to find nearby PSAPs: ${error.message}`)
  }
}

export const lookupPSAP = async (coordinates) => {
  console.log('Starting PSAP lookup for coordinates:', coordinates)

  const callGeminiAPI = async () => {
    console.log('Calling Google Gemini API...')

    const prompt = createPSAPLookupPrompt(coordinates)
    console.log('Generated prompt:', prompt)

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    })

    if (!response || !response.text) {
      throw new Error('No response from Gemini API')
    }

    const responseText = response.text
    console.log('Gemini response:', responseText)

    const parsedResult = parsePSAPResponse(responseText)
    console.log('Parsed result:', parsedResult)

    return parsedResult
  }

  try {
    const result = await retryWithBackoff(callGeminiAPI)
    console.log('PSAP lookup successful:', result)
    return result
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw new Error(`Failed to lookup PSAP: ${error.message}`)
  }
}
