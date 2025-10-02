// PSAP Service for handling ChatGPT Assistant API calls directly from frontend
// For internal tool use - API keys are hardcoded for simplicity

// OpenAI Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here'
const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID || 'asst_RN0vHGUFslFjHb6jjdz6GhKf'

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
      const phoneNumber = trimmedLine.replace('Phone:', '').trim()
      result.phoneNumbers.push({
        type: 'Emergency',
        number: phoneNumber
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

  const callOpenAIAssistantForNearby = async () => {
    console.log('Calling OpenAI Assistant for nearby PSAPs...')

    // Create a thread
    console.log('Creating thread...')
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    })

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.status}`)
    }

    const thread = await threadResponse.json()
    const threadId = thread.id
    console.log('Thread created:', threadId)

    // Add a message to the thread with nearby PSAP request
    console.log('Adding message to thread...')
    const nearbyMessage = `Find all nearby PSAPs and emergency dispatch centers within a 50-mile radius of these coordinates: ${coordinates}.

Please provide multiple backup options in case the primary PSAP is unavailable. Include:
- Primary PSAP for this exact location
- 2-3 nearby backup PSAPs that could handle emergencies in this area
- Regional dispatch centers that cover this area

Format each PSAP as:
PSAP: [Name]
Phone: [Number]
Jurisdiction: [Coverage Area]

Separate each PSAP with a blank line.`

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: nearbyMessage
      })
    })

    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${messageResponse.status}`)
    }

    // Run the assistant
    console.log('Running assistant...')
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    })

    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.status}`)
    }

    const run = await runResponse.json()
    const runId = run.id
    console.log('Run started:', runId)

    // Poll for completion
    let runStatus = 'queued'
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout
    console.log('Polling for completion...')

    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await sleep(1000) // Wait 1 second

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      runStatus = statusData.status
      attempts++
      console.log(`Run status: ${runStatus} (attempt ${attempts})`)

      if (runStatus === 'failed') {
        console.error('Assistant run failed:', statusData)
        throw new Error('Assistant run failed')
      }
    }

    if (runStatus !== 'completed') {
      throw new Error('Assistant run timed out')
    }

    // Get the messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.status}`)
    }

    const messages = await messagesResponse.json()
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant')

    if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
      throw new Error('No response from assistant')
    }

    const responseText = assistantMessage.content[0].text.value
    console.log('Assistant response:', responseText)

    // Parse multiple PSAPs from the response
    const psaps = parseMultiplePSAPResponse(responseText)
    console.log('Parsed nearby PSAPs:', psaps)

    return psaps
  }

  try {
    const result = await retryWithBackoff(callOpenAIAssistantForNearby)
    console.log('Nearby PSAP lookup successful:', result)
    return result
  } catch (error) {
    console.error('Error calling OpenAI Assistant for nearby PSAPs:', error)
    throw new Error(`Failed to find nearby PSAPs: ${error.message}`)
  }
}

export const lookupPSAP = async (coordinates) => {
  console.log('Starting PSAP lookup for coordinates:', coordinates)

  const callOpenAIAssistant = async () => {
    console.log('Calling OpenAI Assistant directly...')

    // Create a thread
    console.log('Creating thread...')
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    })

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.status}`)
    }

    const thread = await threadResponse.json()
    const threadId = thread.id
    console.log('Thread created:', threadId)

    // Add a message to the thread
    console.log('Adding message to thread...')
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: coordinates
      })
    })

    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${messageResponse.status}`)
    }

    // Run the assistant
    console.log('Running assistant...')
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    })

    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.status}`)
    }

    const run = await runResponse.json()
    const runId = run.id
    console.log('Run started:', runId)

    // Poll for completion
    let runStatus = 'queued'
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout
    console.log('Polling for completion...')

    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await sleep(1000) // Wait 1 second

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      runStatus = statusData.status
      attempts++
      console.log(`Run status: ${runStatus} (attempt ${attempts})`)

      if (runStatus === 'failed') {
        console.error('Assistant run failed:', statusData)
        throw new Error('Assistant run failed')
      }
    }

    if (runStatus !== 'completed') {
      throw new Error('Assistant run timed out')
    }

    // Get the messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.status}`)
    }

    const messages = await messagesResponse.json()
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant')

    if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
      throw new Error('No response from assistant')
    }

    const responseText = assistantMessage.content[0].text.value
    console.log('Assistant response:', responseText)

    const parsedResult = parsePSAPResponse(responseText)
    console.log('Parsed result:', parsedResult)

    return parsedResult
  }

  try {
    const result = await retryWithBackoff(callOpenAIAssistant)
    console.log('PSAP lookup successful:', result)
    return result
  } catch (error) {
    console.error('Error calling OpenAI Assistant:', error)
    throw new Error(`Failed to lookup PSAP: ${error.message}`)
  }
}
