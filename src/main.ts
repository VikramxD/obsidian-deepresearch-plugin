import { App, Editor, Menu, Notice, Plugin, MarkdownView } from 'obsidian';
import { SettingsManager, UISettingsTab } from './settings';
import { GeminiAPIService } from './geminiApi';
import { EditorService } from './editorService';
import { FeatureHandler } from './featureHandler';

export default class GeminiAssistantPlugin extends Plugin {
    private settingsManager: SettingsManager;
    private geminiApiService: GeminiAPIService;
    private editorService: EditorService;
    private featureHandler: FeatureHandler;
    private styleElement: HTMLStyleElement;

    async onload() {
        // Initialize the settings manager
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();

        // Initialize services
        this.geminiApiService = new GeminiAPIService(this.settingsManager.getSettings());
        this.editorService = new EditorService();
        this.featureHandler = new FeatureHandler(
            this.geminiApiService, 
            this.editorService, 
            this.settingsManager.getSettings()
        );

        // Add settings tab
        this.addSettingTab(new UISettingsTab(this.app, this, this.settingsManager));

        // Register commands
        this.addCommand({
            id: 'summarize-selection',
            name: 'Summarize Selection with Gemini',
            editorCallback: (editor: Editor) => {
                this.featureHandler.handleSummarize(editor);
            }
        });

        this.addCommand({
            id: 'rephrase-selection',
            name: 'Rephrase Selection with Gemini',
            editorCallback: (editor: Editor) => {
                this.featureHandler.handleRephrase(editor);
            }
        });

        // Add editor menu items (context menu)
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                // Only add the menu items if text is selected
                if (editor.getSelection()) {
                    menu.addItem((item) => {
                        item.setTitle('Summarize with Gemini')
                            .setIcon('align-justify')
                            .onClick(() => this.featureHandler.handleSummarize(editor));
                    });

                    menu.addItem((item) => {
                        item.setTitle('Rephrase with Gemini')
                            .setIcon('edit')
                            .onClick(() => this.featureHandler.handleRephrase(editor));
                    });
                }
            })
        );

        console.log('Gemini Assistant plugin loaded');
    }

    /**
     * Test API connection by sending a small request
     */
    async testApiConnection(): Promise<boolean> {
        try {
            const testPrompt = "Hello, this is a test prompt. Please respond with 'OK' only.";
            const response = await this.geminiApiService.generateContent(testPrompt);
            console.log('API test response:', response);
            return true;
        } catch (error) {
            console.error('API test failed:', error);
            throw error;
        }
    }

    /**
     * Add CSS to the document
     */
    private addStyleToDocument(cssString: string): void {
        // Create a style element
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = cssString;
        
        // Add it to the document head
        document.head.appendChild(this.styleElement);
    }

    onunload() {
        // Clean up the style element if it exists
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.parentNode.removeChild(this.styleElement);
        }
        
        console.log('Gemini Assistant plugin unloaded');
    }
} 