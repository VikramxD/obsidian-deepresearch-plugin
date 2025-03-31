import { requestUrl } from 'obsidian';
import { GeminiAssistantSettings } from './settings';

export interface GenerationOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    // Other options like topK, topP if needed
}

export class GeminiAPIService {
    private apiKey: string;
    private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";
    private lastError: string | null = null;

    constructor(settings: GeminiAssistantSettings) {
        this.apiKey = settings.apiKey;
    }

    public updateSettings(settings: GeminiAssistantSettings): void {
        this.apiKey = settings.apiKey;
    }

    /**
     * Test the connection to the Gemini API
     * @returns Promise<boolean> True if connection is successful
     */
    public async testConnection(): Promise<boolean> {
        try {
            // Just a simple test request to check if the API key is valid
            const url = `${this.baseUrl}/models?key=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error("API connection test failed:", error);
            return false;
        }
    }

    public async generateContent(prompt: string, options: GenerationOptions = {}): Promise<string> {
        try {
            // Use the provided model or fall back to settings
            const model = options.model || "gemini-1.5-pro";
            const temperature = options.temperature !== undefined ? options.temperature : 0.7;
            const maxOutputTokens = options.maxOutputTokens || 2048;

            const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
            
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
                    temperature: temperature,
                    maxOutputTokens: maxOutputTokens,
                    topP: 0.95,
                    topK: 64,
                }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            
            // Extract the text from the response based on Gemini API format
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return text;
        } catch (error) {
            console.error("Error generating content:", error);
            this.lastError = error instanceof Error ? error.message : String(error);
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