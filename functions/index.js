const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

// Load environment variables for local development
require('dotenv').config();

admin.initializeApp();

// OpenAI configuration - using Firebase config for production, env vars for local
const config = functions.config();
const OPENAI_API_KEY = config.openai?.api_key || process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
const ASSISTANT_ID = config.openai?.assistant_id || process.env.ASSISTANT_ID || 'asst_RN0vHGUFslFjHb6jjdz6GhKf';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff retry function
const retryWithBackoff = async (fn, retries = RETRY_CONFIG.maxRetries) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxRetries - retries),
        RETRY_CONFIG.maxDelay
      );
      
      logger.warn(`Retrying in ${delay}ms. Retries left: ${retries}. Error: ${error.message}`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
};

// Check if error is retryable
const isRetryableError = (error) => {
  if (error.message.includes('rate limit')) return true;
  if (error.message.includes('timeout')) return true;
  if (error.message.includes('network')) return true;
  if (error.message.includes('ECONNRESET')) return true;
  if (error.message.includes('ETIMEDOUT')) return true;
  
  // HTTP status codes that are retryable
  const retryableStatusCodes = [429, 500, 502, 503, 504];
  if (error.status && retryableStatusCodes.includes(error.status)) return true;
  
  return false;
};

// Parse the formatted response from the ChatGPT Assistant
const parsePSAPResponse = (responseText) => {
  const lines = responseText.split('\n').filter(line => line.trim());
  const result = {
    psapName: '',
    phoneNumbers: [],
    jurisdictionArea: '',
    rawResponse: responseText
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('PSAP:')) {
      result.psapName = trimmedLine.replace('PSAP:', '').trim();
    } else if (trimmedLine.startsWith('Phone:')) {
      const phoneNumber = trimmedLine.replace('Phone:', '').trim();
      result.phoneNumbers.push({
        type: 'Emergency',
        number: phoneNumber
      });
    } else if (trimmedLine.startsWith('Jurisdiction:')) {
      result.jurisdictionArea = trimmedLine.replace('Jurisdiction:', '').trim();
    }
  });

  return result;
};

// Main PSAP lookup function
const lookupPSAPWithRetry = async (coordinates) => {
  logger.info('Starting PSAP lookup for coordinates:', coordinates);
  
  // Create a thread
  const createThread = async () => {
    logger.info('Creating thread...');
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const thread = await retryWithBackoff(createThread);
  const threadId = thread.id;
  logger.info('Thread created:', threadId);

  // Add a message to the thread
  const addMessage = async () => {
    logger.info('Adding message to thread...');
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
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
    });

    if (!response.ok) {
      throw new Error(`Failed to add message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  await retryWithBackoff(addMessage);

  // Run the assistant
  const runAssistant = async () => {
    logger.info('Running assistant...');
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to run assistant: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const run = await retryWithBackoff(runAssistant);
  const runId = run.id;
  logger.info('Run started:', runId);

  // Poll for completion with retry logic
  let runStatus = 'queued';
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  logger.info('Polling for completion...');

  while (runStatus !== 'completed' && attempts < maxAttempts) {
    await sleep(1000); // Wait 1 second
    
    const checkStatus = async () => {
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check run status: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    const statusData = await retryWithBackoff(checkStatus);
    runStatus = statusData.status;
    attempts++;
    logger.info(`Run status: ${runStatus} (attempt ${attempts})`);

    if (runStatus === 'failed') {
      logger.error('Assistant run failed:', statusData);
      throw new Error('Assistant run failed');
    }
  }

  if (runStatus !== 'completed') {
    throw new Error('Assistant run timed out');
  }

  // Get the messages
  const getMessages = async () => {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const messages = await retryWithBackoff(getMessages);
  const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
  
  if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
    throw new Error('No response from assistant');
  }

  const responseText = assistantMessage.content[0].text.value;
  logger.info('Assistant response:', responseText);
  
  const parsedResult = parsePSAPResponse(responseText);
  logger.info('Parsed result:', parsedResult);
  
  return parsedResult;
};

// Cloud Function for PSAP lookup
exports.lookupPSAP = onRequest({cors: true}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({error: 'Method not allowed'});
        return;
      }

      const {coordinates} = req.body;
      
      if (!coordinates) {
        res.status(400).json({error: 'Coordinates are required'});
        return;
      }

      logger.info('PSAP lookup request received for coordinates:', coordinates);
      
      const result = await lookupPSAPWithRetry(coordinates);
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error in PSAP lookup:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});
