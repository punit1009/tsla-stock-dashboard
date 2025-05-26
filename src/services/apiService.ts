/**
 * API service for making requests to the backend
 */

// Get the API URL from environment variables with a fallback for production
const API_URL = import.meta.env.VITE_GEMINI_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

/**
 * Makes a request to the Gemini API through our backend proxy
 * @param prompt The prompt to send to the API
 * @returns The response from the API
 */
export const geminiProxyRequest = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    return data.response || 'No response from AI';
  } catch (error) {
    console.error('API request failed:', error);
    throw new Error(`Failed to get response from AI service: ${error instanceof Error ? error.message : String(error)}`);
  }
};
