import { App, Editor, Menu, Notice, Plugin, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { SettingsManager, UISettingsTab, DEFAULT_SETTINGS, GeminiAssistantSettings } from './settings';
import { GeminiAPIService } from './geminiApi';
import { EditorService } from './editorService';
import { FeatureHandler } from './featureHandler';
import { ComposerView, COMPOSER_VIEW_TYPE } from './composerView';


export default class GeminiAssistantPlugin extends Plugin {
    public settingsManager: SettingsManager;
    public geminiApiService: GeminiAPIService;
    private editorService: EditorService;
    private featureHandler: FeatureHandler;
    private styleElement: HTMLStyleElement;
    private composerView: ComposerView | null = null;
    public settings: GeminiAssistantSettings;

    async onload() {
        // Initialize settings manager
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();
        this.settings = this.settingsManager.getSettings();
        
        // Initialize the API service with settings
        this.geminiApiService = new GeminiAPIService(this.settings);
        
        // Register the composer view
        this.registerView(
            COMPOSER_VIEW_TYPE,
            (leaf) => {
                this.composerView = new ComposerView(leaf, this.geminiApiService, this.settings);
                return this.composerView;
            }
        );
        
        // Add ribbon icon for the composer view
        this.addRibbonIcon('bot', 'Gemini Assistant', () => {
            this.activateComposerView();
        });

        // Add command for opening the composer view
        this.addCommand({
            id: 'open-gemini-composer',
            name: 'Open Gemini Composer',
            callback: () => {
                this.activateComposerView();
            }
        });

        // Register settings tab - using UISettingsTab which already exists instead of GeminiAssistantSettingTab
        this.addSettingTab(new UISettingsTab(this.app, this, this.settingsManager));

        // Initialize services and feature handler
        this.editorService = new EditorService();
        this.featureHandler = new FeatureHandler(
            this.geminiApiService,
            this.editorService,
            this.settings
        );

        // Add global styles with updated design to match Gemini Composer UI
        this.addStyleToDocument(`
            /* Modern Gemini Composer UI Theme */
            .gemini-composer-container {
                background-color: var(--background-primary);
                color: var(--text-normal);
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .gemini-composer-header {
                background-color: var(--background-secondary-alt);
                padding: 16px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
            }
            
            .gemini-composer-logo {
                font-size: 24px;
                color: var(--interactive-accent);
                margin-right: 12px;
            }
            
            .gemini-composer-title {
                margin: 0;
                font-size: 1.5em;
                font-weight: 600;
                color: var(--text-normal);
            }
            
            .gemini-composer-main-layout {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
            }
            
            .gemini-composer-prompt-section {
                margin-bottom: 16px;
            }
            
            .gemini-composer-status {
                display: flex;
                align-items: center;
                font-size: 0.85em;
                margin-bottom: 16px;
                padding: 4px 8px;
                border-radius: 4px;
                background-color: rgba(0, 100, 0, 0.1);
                color: #4caf50;
                border-left: 3px solid #4caf50;
            }
            
            .gemini-composer-status:before {
                content: "✓";
                margin-right: 8px;
                font-weight: bold;
            }
            
            .gemini-composer-status.error {
                background-color: rgba(100, 0, 0, 0.05);
                color: #ff5252;
                border-left: 3px solid #ff5252;
            }
            
            .gemini-composer-status.error:before {
                content: "✗";
            }
            
            .gemini-composer-label {
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--text-normal);
                font-size: 14px;
            }
            
            .gemini-composer-input-container {
                position: relative;
                margin-bottom: 12px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .gemini-composer-prompt-input {
                width: 100%;
                padding: 12px;
                resize: vertical;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background-color: rgba(30, 30, 30, 0.6);
                min-height: 100px;
                font-family: var(--font-text);
                color: var(--text-normal);
                transition: border-color 0.3s ease;
                font-size: 14px;
            }
            
            .gemini-composer-prompt-input:focus {
                border-color: rgba(255, 255, 255, 0.2);
                outline: none;
            }
            
            .gemini-composer-buttons {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                justify-content: center;
                padding-right: 80px;
            }
            
            .gemini-composer-insert-button {
                display: flex !important;
                align-items: center;
                justify-content: center;
                padding: 8px 16px !important;
                border-radius: 4px;
                font-weight: 400;
                font-size: 14px;
                background-color: #5e5e5e !important;
                color: #ffffff !important;
                transition: all 0.2s ease;
                box-shadow: none !important;
                border: none !important;
                height: 32px;
            }
            
            .gemini-composer-insert-button:hover {
                background-color: #707070 !important;
            }
            
            .gemini-composer-clear-button {
                display: flex !important;
                align-items: center;
                justify-content: center;
                padding: 8px 16px !important;
                border-radius: 4px;
                font-weight: 400;
                font-size: 14px;
                background-color: rgba(255, 255, 255, 0.08) !important;
                color: #cccccc !important;
                transition: all 0.2s ease;
                box-shadow: none !important;
                border: none !important;
                height: 32px;
            }
            
            .gemini-composer-clear-button:hover {
                background-color: rgba(255, 255, 255, 0.12) !important;
            }
            
            .gemini-composer-button-icon {
                margin-right: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: inherit;
            }
            
            .gemini-composer-button-icon svg {
                width: 16px;
                height: 16px;
                color: inherit;
            }
            
            .gemini-composer-presets {
                margin-top: 0;
            }
            
            .gemini-composer-section-title {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--text-normal);
            }
            
            .gemini-composer-presets-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .gemini-composer-preset-btn {
                display: flex;
                align-items: center;
                padding: 10px 12px;
                border-radius: 4px;
                background-color: rgba(30, 30, 30, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.06);
                color: var(--text-normal);
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
            }
            
            .gemini-composer-preset-btn:hover {
                background-color: rgba(60, 60, 60, 0.6);
            }
            
            .gemini-composer-preset-icon {
                font-size: 16px;
                margin-right: 12px;
                color: #aaaaaa;
            }
            
            .gemini-composer-preset-text {
                font-weight: 400;
            }
            
            /* Smart prompt suggestion styling */
            .smart-prompt-suggestion {
                display: block;
                width: 100%;
                text-align: left;
                margin-bottom: 8px;
                padding: 8px 12px;
            }
            
            .smart-prompt-cancel {
                margin-top: 16px;
                opacity: 0.8;
            }
            
            /* Gemini Composer global styles */
            .workspace-leaf-content[data-type="${COMPOSER_VIEW_TYPE}"] {
                overflow-y: auto;
            }
        `);

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

        // Add the new cursor-based commands
        this.addCommand({
            id: 'continue-writing',
            name: 'Continue Writing with Gemini',
            editorCallback: (editor: Editor) => {
                this.featureHandler.handleContinueWriting(editor);
            }
        });

        this.addCommand({
            id: 'smart-prompt',
            name: 'Smart Prompt with Gemini',
            editorCallback: (editor: Editor) => {
                this.featureHandler.handleSmartPrompt(editor);
            }
        });

        // Add a command to reset the model if needed
        this.addCommand({
            id: 'reset-gemini-model',
            name: 'Reset Gemini Model to Default',
            callback: () => {
                this.resetModelToDefault();
            }
        });

        // Add a command to test if active editor is available (for debugging)
        this.addCommand({
            id: 'test-active-editor',
            name: 'Test Active Editor Connection',
            callback: () => {
                this.testActiveEditor();
            }
        });

        // Add editor menu items (context menu)
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                // Only add menu items if text is selected
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

                // Always add cursor-based items
                menu.addItem((item) => {
                    item.setTitle('Continue Writing with Gemini')
                        .setIcon('text')
                        .onClick(() => this.featureHandler.handleContinueWriting(editor));
                });

                menu.addItem((item) => {
                    item.setTitle('Smart Prompt with Gemini')
                        .setIcon('lightbulb')
                        .onClick(() => this.featureHandler.handleSmartPrompt(editor));
                });
            })
        );

        // Test API connection on plugin load
        setTimeout(() => {
            this.testApiConnection()
                .then(success => {
                    if (success) {
                        console.log('Initial API test successful');
                    }
                })
                .catch(error => {
                    console.error('Initial API test failed:', error);
                    // Don't show a notice here as it might be confusing to users
                });
        }, 1000); // slight delay to allow UI to load

        console.log('Gemini Assistant plugin loaded');
    }

    /**
     * Activate the composer view
     */
    async activateComposerView() {
        const { workspace } = this.app;
        
        // If view already exists, show it
        let leaf = workspace.getLeavesOfType(COMPOSER_VIEW_TYPE)[0];
        
        if (!leaf) {
            // Create a new leaf in the right sidebar and use type assertion
            const rightLeaf = workspace.getRightLeaf(false);
            if (!rightLeaf) {
                new Notice('Unable to create Gemini Composer view');
                return;
            }
            
            await rightLeaf.setViewState({ type: COMPOSER_VIEW_TYPE });
            leaf = rightLeaf;
        }
        
        // Reveal the leaf
        workspace.revealLeaf(leaf);
    }

    /**
     * Test API connection by sending a small request
     */
    public async testApiConnection(): Promise<boolean> {
        return await this.geminiApiService.testConnection();
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
        
        // Unregister the view
        this.app.workspace.detachLeavesOfType(COMPOSER_VIEW_TYPE);
        
        console.log('Gemini Assistant plugin unloaded');
    }

    /**
     * Reset the model to the default if needed
     */
    async resetModelToDefault(): Promise<void> {
        const settings = this.settingsManager.getSettings();
        settings.model = DEFAULT_SETTINGS.model;  // Use model instead of modelName
        await this.settingsManager.saveSettings();
        
        // Update the service with the new settings
        this.geminiApiService.updateSettings(settings);
        
        // Update the composer view if it exists
        if (this.composerView) {
            this.composerView.updateSettings(settings);
        }
        
        new Notice(`Gemini model reset to default: ${DEFAULT_SETTINGS.model}`);
    }

    /**
     * Test if an active editor is available for debugging
     */
    testActiveEditor(): void {
        let editorFound = false;
        let editorInfo = "Editor Information:\n";
        
        // Get the active leaf
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf) {
            editorInfo += "Active leaf found\n";
            
            // Get the view
            const view = activeLeaf.view;
            if (view) {
                editorInfo += `View type: ${view.getViewType()}\n`;
                
                // Check if this is a markdown view
                if (view.getViewType() === 'markdown') {
                    // @ts-ignore
                    const editor = view.editor;
                    if (editor) {
                        editorFound = true;
                        editorInfo += "Markdown editor found\n";
                        editorInfo += `Read-only: ${editor.getOption('readOnly')}\n`;
                        
                        // Try to get cursor position
                        try {
                            const cursor = editor.getCursor();
                            editorInfo += `Cursor position: Line ${cursor.line}, Ch ${cursor.ch}\n`;
                        } catch (e) {
                            editorInfo += `Error getting cursor: ${e}\n`;
                        }
                    }
                } else {
                    // Try to access editor property on other views
                    // @ts-ignore
                    const editor = (view as any).editor;
                    if (editor) {
                        editorFound = true;
                        editorInfo += `Other editor type found (${view.getViewType()})\n`;
                    }
                }
            } else {
                editorInfo += "No view found in active leaf\n";
            }
        } else {
            editorInfo += "No active leaf found\n";
        }
        
        // Try alternative methods
        editorInfo += "\nAlternative methods:\n";
        
        // Try to get markdown leaves
        const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
        editorInfo += `Markdown leaves: ${markdownLeaves.length}\n`;
        
        if (markdownLeaves.length > 0) {
            // @ts-ignore
            const editor = markdownLeaves[0].view.editor;
            if (editor) {
                editorFound = true;
                editorInfo += "Editor found in first markdown leaf\n";
            }
        }
        
        // Try activeEditor property
        // @ts-ignore
        const activeEditor = this.app.workspace.activeEditor?.editor;
        if (activeEditor) {
            editorFound = true;
            editorInfo += "Active editor found via workspace.activeEditor\n";
        }
        
        // Show results
        if (editorFound) {
            new Notice("Editor found. Check console for details.", 4000);
        } else {
            new Notice("No editor found. Check console for details.", 4000);
        }
        
        console.log(editorInfo);
    }

    // Helper method to update settings in the composer view
    updateComposerViewSettings(): void {
        if (this.composerView) {
            this.composerView.updateSettings(this.settings);
        }
    }
} 