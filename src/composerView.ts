import { ItemView, WorkspaceLeaf, Notice, setIcon, ButtonComponent, MarkdownView } from 'obsidian';
import { GeminiAPIService } from './geminiApi';
import { GeminiAssistantSettings } from './settings';

export const COMPOSER_VIEW_TYPE = 'gemini-composer-view';

export class ComposerView extends ItemView {
    private geminiApiService: GeminiAPIService;
    private settings: GeminiAssistantSettings;
    private promptInput: HTMLTextAreaElement;
    private outputEl: HTMLElement;
    private generatingContent: boolean = false;
    private statusEl: HTMLElement;
    private apiConnected: boolean = false;

    constructor(leaf: WorkspaceLeaf, geminiApiService: GeminiAPIService, settings: GeminiAssistantSettings) {
        super(leaf);
        this.geminiApiService = geminiApiService;
        this.settings = settings;
    }

    getViewType(): string {
        return COMPOSER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Gemini Composer';
    }

    getIcon(): string {
        return 'bot';
    }

    async onOpen(): Promise<void> {
        const { containerEl } = this;
        
        // Clear the container
        containerEl.empty();
        containerEl.addClass('gemini-composer-container');
        
        // Create the composer interface with improved header like Gemini Composer
        const headerEl = containerEl.createDiv({ cls: 'gemini-composer-header' });
        
        // Add a logo/icon to the header
        const logoEl = headerEl.createSpan({ cls: 'gemini-composer-logo' });
        setIcon(logoEl, 'bot');
        
        headerEl.createEl('h2', { text: 'Gemini Composer', cls: 'gemini-composer-title' });
        
        // Create the main layout
        const mainLayout = containerEl.createDiv({ cls: 'gemini-composer-main-layout' });
        
        // Create a status indicator for API similar to the "API connected" UI in the screenshot
        this.statusEl = mainLayout.createDiv({ cls: 'gemini-composer-status' });
        
        // Create the prompt section
        const promptSection = mainLayout.createDiv({ cls: 'gemini-composer-prompt-section' });
        
        promptSection.createEl('label', { text: 'What would you like to generate?', cls: 'gemini-composer-label' });
        
        // Input container with dark styling similar to the screenshot
        const inputContainer = promptSection.createDiv({ cls: 'gemini-composer-input-container' });
        
        this.promptInput = inputContainer.createEl('textarea', { 
            cls: 'gemini-composer-prompt-input',
            attr: { 
                placeholder: 'Enter instructions for Gemini...',
                rows: '5'
            }
        });
        
        // Create buttons container similar to the "Insert into Editor" and "Clear" buttons shown
        const buttonsContainer = promptSection.createDiv({ cls: 'gemini-composer-buttons' });
        
        // Add insert button styled like the screenshot's "Insert into Editor" button
        const insertBtn = new ButtonComponent(buttonsContainer)
            .setButtonText('Insert into Editor')
            .setCta()
            .onClick(() => this.generateAndInsertContent());
        insertBtn.buttonEl.addClass('gemini-composer-insert-button');
        
        // Create the icon element and add it before the text
        const insertIconEl = document.createElement('span');
        insertIconEl.className = 'gemini-composer-button-icon';
        setIcon(insertIconEl, 'arrow-right');
        insertBtn.buttonEl.prepend(insertIconEl);
        
        // Add clear button styled like the screenshot's "Clear" button
        const clearBtn = new ButtonComponent(buttonsContainer)
            .setButtonText('Clear')
            .onClick(() => this.clearPrompt());
        clearBtn.buttonEl.addClass('gemini-composer-clear-button');
        
        // Create the icon element and add it before the text
        const clearIconEl = document.createElement('span');
        clearIconEl.className = 'gemini-composer-button-icon';
        setIcon(clearIconEl, 'trash');
        clearBtn.buttonEl.prepend(clearIconEl);
        
        // Add some preset prompts for quick use, styled similar to the "Quick Prompts" section in the screenshot
        const presetsContainer = mainLayout.createDiv({ cls: 'gemini-composer-presets' });
        presetsContainer.createEl('h3', { text: 'Quick Prompts', cls: 'gemini-composer-section-title' });
        
        const presetsList = presetsContainer.createDiv({ cls: 'gemini-composer-presets-list' });
        
        const createPresetButton = (text: string, prompt: string, icon: string) => {
            const btn = presetsList.createEl('button', { 
                cls: 'gemini-composer-preset-btn'
            });
            const iconEl = btn.createSpan({ cls: 'gemini-composer-preset-icon' });
            setIcon(iconEl, icon);
            btn.createSpan({ text: text, cls: 'gemini-composer-preset-text' });
            
            btn.addEventListener('click', () => {
                this.promptInput.value = prompt;
                // Focus the textarea and trigger an input event
                this.promptInput.focus();
                this.promptInput.dispatchEvent(new Event('input'));
            });
        };
        
        // Create preset buttons matching the ones shown in the screenshot
        createPresetButton('Note Template', 'Create a detailed template for a note on [topic]. Include sections for key concepts, examples, resources, and questions to explore.', 'file-text');
        createPresetButton('Meeting Notes', 'Create a template for meeting notes with sections for attendees, agenda items, discussion points, action items, and next steps.', 'people');
        createPresetButton('Concept Map', 'Create a textual concept map for understanding [topic], showing key concepts and their relationships.', 'hash');
        createPresetButton('Literature Notes', 'Help me create structured notes for a book/article about [topic]. Include summary, key ideas, quotes, and personal reflections.', 'book');
        
        // Hidden element for temporary storage of generated content
        this.outputEl = mainLayout.createDiv({ cls: 'gemini-composer-hidden-output' });
        this.outputEl.style.display = 'none';
        
        // Test API connection and update status
        this.updateApiStatus();
        
        // Add styling to match the dark theme Gemini Composer UI shown in the screenshot
        containerEl.createEl('style', {
            text: `
                .gemini-composer-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: var(--font-interface);
                    color: var(--text-normal);
                    overflow-y: auto;
                    padding: 0;
                    background-color: var(--background-primary);
                }
                
                .gemini-composer-header {
                    display: flex;
                    align-items: center;
                    padding: 16px 24px;
                    background-color: var(--background-secondary-alt);
                    border-bottom: 1px solid var(--background-modifier-border);
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
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .gemini-composer-status {
                    display: flex;
                    align-items: center;
                    font-size: 0.85em;
                    margin-bottom: 16px;
                    padding: 10px 16px;
                    border-radius: 4px;
                    background-color: rgba(0, 100, 0, 0.1);
                    color: var(--text-success);
                    border-left: 3px solid var(--text-success);
                    transition: all 0.3s ease;
                }
                
                .gemini-composer-status:before {
                    content: "✓";
                    margin-right: 8px;
                    font-weight: bold;
                }
                
                .gemini-composer-status.error {
                    background-color: rgba(100, 0, 0, 0.1);
                    color: var(--text-error);
                    border-left: 3px solid var(--text-error);
                }
                
                .gemini-composer-status.error:before {
                    content: "✗";
                }
                
                .gemini-composer-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--text-normal);
                }
                
                .gemini-composer-input-container {
                    position: relative;
                    margin-bottom: 16px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                
                .gemini-composer-prompt-input {
                    width: 100%;
                    padding: 16px;
                    resize: vertical;
                    border-radius: 8px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-secondary-alt);
                    min-height: 120px;
                    font-family: var(--font-text);
                    color: var(--text-normal);
                    transition: border-color 0.3s ease;
                }
                
                .gemini-composer-prompt-input:focus {
                    border-color: var(--interactive-accent);
                    outline: none;
                }
                
                .gemini-composer-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    justify-content: flex-end;
                }
                
                .gemini-composer-insert-button {
                    display: flex !important;
                    align-items: center;
                    padding: 10px 20px !important;
                    border-radius: 8px;
                    font-weight: 500;
                    background-color: var(--interactive-accent) !important;
                    color: var(--text-on-accent) !important;
                    transition: all 0.2s ease;
                }
                
                .gemini-composer-insert-button:hover {
                    filter: brightness(1.1);
                }
                
                .gemini-composer-clear-button {
                    display: flex !important;
                    align-items: center;
                    padding: 10px 20px !important;
                    border-radius: 8px;
                    font-weight: 500;
                    background-color: var(--background-secondary) !important;
                    color: var(--text-muted) !important;
                    transition: all 0.2s ease;
                }
                
                .gemini-composer-clear-button:hover {
                    background-color: var(--background-modifier-hover) !important;
                }
                
                .gemini-composer-button-icon {
                    margin-right: 8px;
                }
                
                /* Quick Prompts section styled like the screenshot */
                .gemini-composer-presets {
                    margin-top: 12px;
                }
                
                .gemini-composer-section-title {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--text-normal);
                }
                
                .gemini-composer-presets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .gemini-composer-preset-btn {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    border-radius: 8px;
                    background-color: var(--background-secondary-alt);
                    border: 1px solid var(--background-modifier-border);
                    color: var(--text-normal);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .gemini-composer-preset-btn:hover {
                    background-color: var(--background-modifier-hover);
                }
                
                .gemini-composer-preset-icon {
                    font-size: 16px;
                    margin-right: 12px;
                    color: var(--text-muted);
                }
                
                .gemini-composer-preset-text {
                    font-weight: 500;
                }
            `
        });
    }

    // Method to update API connection status
    async updateApiStatus(): Promise<void> {
        try {
            if (!this.settings.apiKey) {
                this.statusEl.textContent = 'API disconnected';
                this.statusEl.addClass('error');
                this.apiConnected = false;
                return;
            }

            // Try a simple API call
            const testResult = await this.geminiApiService.testConnection();
            
            if (testResult) {
                this.statusEl.textContent = 'API connected';
                this.statusEl.removeClass('error');
                this.apiConnected = true;
            } else {
                throw new Error('API test failed');
            }
        } catch (error) {
            this.statusEl.textContent = 'API disconnected';
            this.statusEl.addClass('error');
            this.apiConnected = false;
        }
    }

    // Method to generate content and insert it into the editor
    async generateAndInsertContent(): Promise<void> {
        if (this.generatingContent) {
            new Notice('Already generating content, please wait...');
            return;
        }

        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            new Notice('Please enter a prompt first');
            return;
        }

        if (!this.apiConnected) {
            new Notice('API is not connected. Please check your API key in settings.');
            return;
        }

        try {
            this.generatingContent = true;
            new Notice('Generating content with Gemini...');

            // Generate the content first
            const response = await this.geminiApiService.generateContent(prompt);
            
            // Try to find an active editor
            let editor = null;
            let insertedSuccessfully = false;
            
            // Method 1: Get any active markdown leaf (most reliable)
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            if (leaves.length > 0) {
                // Focus the first markdown leaf found
                const leaf = leaves[0];
                this.app.workspace.setActiveLeaf(leaf, { focus: true });
                
                // Get the editor from the view
                const view = leaf.view;
                if (view instanceof MarkdownView && view.editor) {
                    editor = view.editor;
                    
                    // Insert at current cursor position
                    const currentPos = editor.getCursor();
                    editor.replaceRange(response, currentPos);
                    insertedSuccessfully = true;
                }
            }
            
            if (insertedSuccessfully) {
                new Notice('Content inserted successfully!');
            } else {
                // If no suitable editor was found, copy to clipboard
                await navigator.clipboard.writeText(response);
                new Notice('No active note found. Content copied to clipboard!');
            }
            
            this.clearPrompt();
        } catch (error) {
            new Notice(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.generatingContent = false;
        }
    }

    // Method to clear the prompt input
    clearPrompt(): void {
        this.promptInput.value = '';
        this.promptInput.style.height = 'auto';
        this.promptInput.focus();
    }

    // Method to update settings
    updateSettings(settings: GeminiAssistantSettings): void {
        this.settings = settings;
        this.updateApiStatus();
    }

    async onClose(): Promise<void> {
        // Clean up as needed
    }
} 