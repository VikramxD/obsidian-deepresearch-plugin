import { Editor, Notice } from 'obsidian';
import { GeminiAPIService } from './geminiApi';
import { EditorService } from './editorService';
import { GeminiAssistantSettings } from './settings';

export class FeatureHandler {
    private geminiApiService: GeminiAPIService;
    private editorService: EditorService;
    private settings: GeminiAssistantSettings;

    constructor(geminiApiService: GeminiAPIService, editorService: EditorService, settings: GeminiAssistantSettings) {
        this.geminiApiService = geminiApiService;
        this.editorService = editorService;
        this.settings = settings;
    }

    /**
     * Update the settings when they change
     */
    public updateSettings(settings: GeminiAssistantSettings): void {
        this.settings = settings;
        this.geminiApiService.updateSettings(settings);
    }

    /**
     * Get access to the GeminiAPIService for autocomplete features
     */
    public getGeminiApiService(): GeminiAPIService {
        return this.geminiApiService;
    }

    /**
     * Handle summarizing the selected text.
     */
    public async handleSummarize(editor: Editor): Promise<void> {
        const selectedText = this.editorService.getSelectedText(editor);
        
        if (!selectedText) {
            new Notice('Please select some text to summarize.');
            return;
        }

        try {
            const loadingNotice = new Notice('Contacting Gemini...', 30000);
            
            const prompt = `Please summarize the following text concisely:\n\n${selectedText}`;
            const result = await this.geminiApiService.generateContent(prompt);
            
            loadingNotice.hide();
            
            this.editorService.insertTextBelowSelection(editor, result);
            new Notice('Summary inserted.');
        } catch (error) {
            new Notice(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Summarize error:', error);
        }
    }

    /**
     * Handle rephrasing the selected text.
     */
    public async handleRephrase(editor: Editor): Promise<void> {
        const selectedText = this.editorService.getSelectedText(editor);
        
        if (!selectedText) {
            new Notice('Please select some text to rephrase.');
            return;
        }

        try {
            const loadingNotice = new Notice('Contacting Gemini...', 30000);
            
            const prompt = `Rephrase the following text to improve clarity while keeping the meaning:

"${selectedText}"`;
            
            const result = await this.geminiApiService.generateContent(prompt);
            
            loadingNotice.hide();
            
            // Use EditorService to replace the selection
            this.editorService.replaceSelection(editor, result);
            new Notice('Text rephrased successfully.');
        } catch (error) {
            new Notice(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Rephrase error:', error);
        }
    }
} 