import { Editor, Menu, Notice, Modal, App } from 'obsidian';
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

    /**
     * Handle continuing writing from the cursor position.
     */
    public async handleContinueWriting(editor: Editor): Promise<void> {
        try {
            const contextText = this.editorService.getTextBeforeCursor(editor, this.settings.contextSize);
            
            if (!contextText || contextText.trim() === '') {
                new Notice('No content found before cursor. Please add some text first.');
                return;
            }
            
            const loadingNotice = new Notice('Contacting Gemini...', 30000);
            
            const prompt = `Continue this text naturally and coherently:\n\n${contextText}`;
            const result = await this.geminiApiService.generateContent(prompt);
            
            loadingNotice.hide();
            
            this.editorService.insertTextAtCursor(editor, ' ' + result);
            new Notice('Continuation added.');
        } catch (error) {
            new Notice(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Continue writing error:', error);
        }
    }

    /**
     * Handle smart prompting at the cursor position.
     */
    public async handleSmartPrompt(editor: Editor): Promise<void> {
        try {
            const contextText = this.editorService.getTextBeforeCursor(editor, this.settings.contextSize);
            
            if (!contextText || contextText.trim() === '') {
                new Notice('No content found before cursor. Please add some text first.');
                return;
            }
            
            const loadingNotice = new Notice('Analyzing content...', 30000);
            
            // First, ask Gemini to analyze the context and suggest actions
            const analysisPrompt = `Analyze this text and suggest 3-5 ways to continue or enhance it. Each suggestion should be a short phrase starting with an action verb. Format as a simple list with one suggestion per line, no numbering or bullet points:\n\n${contextText}`;
            
            const suggestions = await this.geminiApiService.generateContent(analysisPrompt);
            loadingNotice.hide();
            
            // Display suggestions in a modal
            // Get app instance from editor's owner.app
            const app = (editor as any).cm.ownerDocument.defaultView.app;
            new SmartPromptModal(app, editor, this.geminiApiService, this.editorService, contextText, suggestions.split('\n').filter(s => s.trim() !== '')).open();
        } catch (error) {
            new Notice(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Smart prompt error:', error);
        }
    }
}

/**
 * Modal to display smart prompt suggestions
 */
class SmartPromptModal extends Modal {
    private editor: Editor;
    private geminiApiService: GeminiAPIService;
    private editorService: EditorService;
    private contextText: string;
    private suggestions: string[];
    
    constructor(app: App, editor: Editor, geminiApiService: GeminiAPIService, editorService: EditorService, contextText: string, suggestions: string[]) {
        super(app);
        this.editor = editor;
        this.geminiApiService = geminiApiService;
        this.editorService = editorService;
        this.contextText = contextText;
        this.suggestions = suggestions;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Gemini Suggestions' });
        
        // Instructions
        contentEl.createEl('p', { text: 'Click a suggestion to continue your writing:' });
        
        // Create a button for each suggestion
        for (const suggestion of this.suggestions) {
            const suggestionBtn = contentEl.createEl('button', { 
                text: suggestion,
                cls: 'mod-cta smart-prompt-suggestion'
            });
            
            suggestionBtn.addEventListener('click', async () => {
                const loadingNotice = new Notice(`Generating content for "${suggestion}"...`, 30000);
                
                try {
                    const prompt = `${this.contextText}\n\nBased on the above text, ${suggestion.toLowerCase()}. Make sure your response continues naturally from the original text as if it were written by the same author:`;
                    
                    const result = await this.geminiApiService.generateContent(prompt);
                    
                    loadingNotice.hide();
                    this.close();
                    
                    this.editorService.insertTextAtCursor(this.editor, ' ' + result);
                    new Notice('Content added successfully.');
                } catch (error) {
                    loadingNotice.hide();
                    new Notice(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
                    console.error('Smart prompt generation error:', error);
                }
            });
        }
        
        // Add a cancel button
        const cancelBtn = contentEl.createEl('button', {
            text: 'Cancel',
            cls: 'smart-prompt-cancel'
        });
        
        cancelBtn.addEventListener('click', () => {
            this.close();
        });
        
        // Add some basic styling
        contentEl.createEl('style', {
            text: `
                .smart-prompt-suggestion {
                    display: block;
                    width: 100%;
                    margin-bottom: 8px;
                    text-align: left;
                    padding: 8px 12px;
                }
                .smart-prompt-cancel {
                    margin-top: 16px;
                }
            `
        });
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 