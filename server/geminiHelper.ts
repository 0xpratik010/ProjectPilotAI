import axios from 'axios';

export async function geminiChatCompletion({ prompt, apiKey }: { prompt: string; apiKey: string }) {
  try {
    console.log("Sending request to Gemini API with prompt length:", prompt.length);
    
    // Direct API call using axios instead of the SDK
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Gemini API response received");
    
    // Log the full Gemini API response for debugging
    console.log("Gemini API full response:", JSON.stringify(response.data, null, 2));
    // Extract the text from the response
    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Response text length:", responseText.length);
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.log("Failed to parse response as JSON, returning as text");
      return responseText;
    }
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    throw error;
  }
}
