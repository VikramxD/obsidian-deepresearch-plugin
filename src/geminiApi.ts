import { requestUrl } from 'obsidian';
import { GeminiAssistantSettings } from './settings';

export class GeminiAPIService {
    private apiKey: string;
    private modelName: string;
    private lastError: string | null = null;

    constructor(settings: GeminiAssistantSettings) {
        this.apiKey = settings.apiKey;
        this.modelName = settings.modelName;
    }

    public updateSettings(settings: GeminiAssistantSettings): void {
        this.apiKey = settings.apiKey;
        this.modelName = settings.modelName;
    }

    /**
     * Test the connection to the Gemini API
     * @returns Promise<boolean> True if connection is successful
     */
    public async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const testPrompt = "Hello, this is a test prompt. Please respond with 'OK' only.";
            await this.generateContent(testPrompt);
            return true;
        } catch (error) {
            console.error('API test connection failed:', error);
            return false;
        }
    }

    public async generateContent(prompt: string): Promise<string> {
        if (!this.apiKey) {
            this.lastError = 'API key is not set. Please configure it in the settings.';
            throw new Error(this.lastError);
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
        
        try {
            console.log(`Sending request to Gemini API using model: ${this.modelName}`);
            console.log(`Prompt (first 50 chars): ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
            
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };
            
            console.log('Request body:', JSON.stringify(requestBody));
            
            const response = await requestUrl({
                url: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            // Log the response status
            console.log(`Gemini API response status: ${response.status}`);

            if (response.status !== 200) {
                let errorMessage = `API request failed with status ${response.status}`;
                
                try {
                    // Try to extract more detailed error info from response
                    const errorData = response.json;
                    console.error('Error response data:', errorData);
                    if (errorData && errorData.error) {
                        errorMessage += `: ${errorData.error.message || 'Unknown error'}`;
                        if (errorData.error.details) {
                            errorMessage += ` (${JSON.stringify(errorData.error.details)})`;
                        }
                    }
                } catch (e) {
                    // If we can't parse the JSON, use the text response
                    console.error('Failed to parse error response:', e);
                    errorMessage += `: ${response.text || 'No additional details available'}`;
                }
                
                this.lastError = errorMessage;
                throw new Error(errorMessage);
            }

            const responseData = response.json;
            
            // Log the complete response for debugging
            console.log('Complete Gemini API response:', JSON.stringify(responseData, null, 2));
            console.log('Response data keys:', Object.keys(responseData));
            
            // First, check for any feedback from the API about the prompt
            if (responseData.promptFeedback) {
                console.log('Prompt feedback:', responseData.promptFeedback);
                
                if (responseData.promptFeedback.blockReason) {
                    // Handle content filtering blocks
                    const blockReason = responseData.promptFeedback.blockReason;
                    let blockMessage = `Content blocked by Gemini API. Reason: ${blockReason}`;
                    
                    if (responseData.promptFeedback.blockReasonMessage) {
                        blockMessage += ` - ${responseData.promptFeedback.blockReasonMessage}`;
                    }
                    
                    this.lastError = blockMessage;
                    throw new Error(blockMessage);
                }
            }
            
            // Check if we have candidates in the response
            if (!responseData.candidates || responseData.candidates.length === 0) {
                console.error('No candidates in response:', responseData);
                this.lastError = 'Gemini API returned no candidates. The API may be experiencing issues.';
                throw new Error(this.lastError);
            }
            
            // Log information about each candidate
            responseData.candidates.forEach((candidate: any, index: number) => {
                console.log(`Candidate ${index} finish reason:`, candidate.finishReason);
                console.log(`Candidate ${index} safety ratings:`, candidate.safetyRatings);
                
                if (candidate.content) {
                    console.log(`Candidate ${index} content parts:`, candidate.content.parts ? candidate.content.parts.length : 'none');
                } else {
                    console.log(`Candidate ${index} has no content`);
                }
            });
            
            // Extract the generated text from the response
            if (responseData.candidates[0].content && 
                responseData.candidates[0].content.parts && 
                responseData.candidates[0].content.parts.length > 0) {
                
                const generatedText = responseData.candidates[0].content.parts[0].text;
                
                // Check if the text is empty and provide more specific error
                if (!generatedText || generatedText.trim() === '') {
                    console.error('Empty text in response part:', responseData.candidates[0].content.parts[0]);
                    this.lastError = 'Gemini returned an empty response. Try rephrasing your prompt or check API settings.';
                    throw new Error(this.lastError);
                }
                
                // Clear any previous error
                this.lastError = null;
                return generatedText;
            } else {
                // Detailed logging of the response structure
                console.error('Unexpected API response structure:', responseData);
                console.error('Candidate 0:', responseData.candidates[0]);
                
                if (responseData.candidates[0].content) {
                    console.error('Content:', responseData.candidates[0].content);
                }
                
                if (responseData.candidates[0].finishReason) {
                    console.error('Finish reason:', responseData.candidates[0].finishReason);
                    
                    // Handle specific finish reasons
                    if (responseData.candidates[0].finishReason === 'SAFETY') {
                        this.lastError = 'Content generation stopped due to safety filters. Try rephrasing your prompt.';
                        throw new Error(this.lastError);
                    } else if (responseData.candidates[0].finishReason === 'RECITATION') {
                        this.lastError = 'Content generation stopped due to potential recitation of training data. Try rephrasing your prompt.';
                        throw new Error(this.lastError);
                    }
                }
                
                // Check if there's finishMessage in the response
                if (responseData.candidates[0].finishMessage) {
                    this.lastError = `Content generation stopped: ${responseData.candidates[0].finishMessage}`;
                    throw new Error(this.lastError);
                }
                
                this.lastError = 'No content generated by Gemini API. The response structure was unexpected. Check console for details.';
                throw new Error(this.lastError);
            }
        } catch (error) {
            // Log the full error details
            console.error('Gemini API error:', error);
            
            // Check if this is a network error
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError') ||
                    error.message.includes('Network request failed')) {
                    this.lastError = 'Network error when contacting Gemini API. Please check your internet connection.';
                    throw new Error(this.lastError);
                }
                
                // Check for invalid API key
                if (error.message.includes('API key not valid') || 
                    error.message.includes('invalid API key') ||
                    error.message.includes('403')) {
                    this.lastError = 'Invalid API key. Please double-check your API key in settings.';
                    throw new Error(this.lastError);
                }
                
                // Check for rate limit issues
                if (error.message.includes('quota') || 
                    error.message.includes('rate limit') ||
                    error.message.includes('429')) {
                    this.lastError = 'API rate limit exceeded. Please try again later.';
                    throw new Error(this.lastError);
                }
            }
            
            // If we haven't set a more specific lastError, set it from the error
            if (!this.lastError) {
                this.lastError = error instanceof Error ? error.message : String(error);
            }
            
            throw error;
        }
    }
    
    /**
     * Get the last error message from the API
     */
    public getLastError(): string | null {
        return this.lastError;
    }
} 