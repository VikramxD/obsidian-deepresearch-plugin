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
        
        // Create the composer interface with improved header
        const headerEl = containerEl.createDiv({ cls: 'gemini-composer-header' });
        
        // Add a logo/icon to the header
        const logoEl = headerEl.createSpan({ cls: 'gemini-composer-logo' });
        setIcon(logoEl, 'bot');
        
        headerEl.createEl('h2', { text: 'Gemini Composer', cls: 'gemini-composer-title' });
        
        // Create the main layout
        const mainLayout = containerEl.createDiv({ cls: 'gemini-composer-main-layout' });
        
        // Create the prompt section
        const promptSection = mainLayout.createDiv({ cls: 'gemini-composer-prompt-section' });
        
        promptSection.createEl('label', { text: 'What would you like to generate?', cls: 'gemini-composer-label' });
        
        // Input container
        const inputContainer = promptSection.createDiv({ cls: 'gemini-composer-input-container' });
        
        this.promptInput = inputContainer.createEl('textarea', { 
            cls: 'gemini-composer-prompt-input',
            attr: { 
                placeholder: 'Enter instructions for Gemini...',
                rows: '5'
            }
        });
        
        // Advanced options toggle
        const advancedOptionsToggle = promptSection.createDiv({ cls: 'gemini-composer-advanced-toggle' });
        const toggleButton = advancedOptionsToggle.createEl('button', { 
            cls: 'gemini-composer-toggle-btn',
            text: 'Advanced options'
        });
        
        const advancedOptionsContent = promptSection.createDiv({ cls: 'gemini-composer-advanced-options' });
        advancedOptionsContent.style.display = 'none';
        
        // Advanced options content - Temperature, Max tokens, etc.
        const temperatureContainer = advancedOptionsContent.createDiv({ cls: 'gemini-composer-option-container' });
        temperatureContainer.createEl('label', { text: 'Temperature:', cls: 'gemini-composer-option-label' });
        const temperatureSlider = temperatureContainer.createEl('input', {
            cls: 'gemini-composer-slider',
            attr: {
                type: 'range',
                min: '0',
                max: '1',
                step: '0.1',
                value: '0.7'
            }
        });
        const temperatureValue = temperatureContainer.createEl('span', { 
            cls: 'gemini-composer-option-value',
            text: '0.7'
        });
        
        temperatureSlider.addEventListener('input', (e) => {
            temperatureValue.textContent = (e.target as HTMLInputElement).value;
        });
        
        const maxTokensContainer = advancedOptionsContent.createDiv({ cls: 'gemini-composer-option-container' });
        maxTokensContainer.createEl('label', { text: 'Max output tokens:', cls: 'gemini-composer-option-label' });
        const maxTokensInput = maxTokensContainer.createEl('input', {
            cls: 'gemini-composer-number-input',
            attr: {
                type: 'number',
                min: '1',
                max: '8192',
                value: '2048'
            }
        });
        
        // Toggle advanced options visibility
        toggleButton.addEventListener('click', () => {
            const isVisible = advancedOptionsContent.style.display !== 'none';
            advancedOptionsContent.style.display = isVisible ? 'none' : 'block';
            toggleButton.textContent = isVisible ? 'Advanced options' : 'Hide advanced options';
        });
        
        // Create buttons container with improved styling
        const buttonsContainer = promptSection.createDiv({ cls: 'gemini-composer-buttons' });
        
        // Add generate button (renamed from Insert into Editor)
        const generateBtn = new ButtonComponent(buttonsContainer)
            .setButtonText('Generate')
            .setCta()
            .onClick(() => this.generateContent());
        generateBtn.buttonEl.addClass('gemini-composer-generate-button');
        
        // Create the icon element and add it before the text
        const generateIconEl = document.createElement('span');
        generateIconEl.className = 'gemini-composer-button-icon';
        setIcon(generateIconEl, 'sparkles');  // Changed from arrow-right to sparkles
        generateBtn.buttonEl.prepend(generateIconEl);
        
        // Add clear button
        const clearBtn = new ButtonComponent(buttonsContainer)
            .setButtonText('Clear')
            .onClick(() => this.clearPrompt());
        clearBtn.buttonEl.addClass('gemini-composer-clear-button');
        
        // Create the icon element and add it before the text
        const clearIconEl = document.createElement('span');
        clearIconEl.className = 'gemini-composer-button-icon';
        setIcon(clearIconEl, 'trash');
        clearBtn.buttonEl.prepend(clearIconEl);
        
        // Add quick prompts section
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
        
        // Update presets to be more relevant to the latest capabilities
        createPresetButton('Note Template', 'Create a detailed template for a note on [topic]. Include sections for key concepts, examples, resources, and questions to explore.', 'file-text');
        createPresetButton('Meeting Notes', 'Create a template for meeting notes with sections for attendees, agenda items, discussion points, action items, and next steps.', 'people');
        createPresetButton('JSON Output', 'Generate a JSON structure for [describe your data structure]. Return only valid JSON with no explanation.', 'braces');
        createPresetButton('Long Context Analysis', 'Analyze the following text and extract the key themes, arguments, and insights: [paste your text here]', 'search');
        
        // Hidden element for temporary storage of generated content
        this.outputEl = mainLayout.createDiv({ cls: 'gemini-composer-hidden-output' });
        this.outputEl.style.display = 'none';
        
        // Create a footer section for the API status indicator
        const footerEl = containerEl.createDiv({ cls: 'gemini-composer-footer' });
        
        // Create a status indicator for API as a simple dot with text at the bottom
        this.statusEl = footerEl.createDiv({ cls: 'gemini-composer-status' });
        
        // Test API connection and update status
        this.updateApiStatus();
        
        // Add styling to match the modern Gemini UI
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
                
                .gemini-composer-advanced-toggle {
                    margin-bottom: 16px;
                }
                
                .gemini-composer-toggle-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-accent);
                    cursor: pointer;
                    padding: 0;
                    font-size: 0.9em;
                    text-decoration: underline;
                }
                
                .gemini-composer-advanced-options {
                    background-color: var(--background-secondary-alt);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                
                .gemini-composer-option-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .gemini-composer-option-label {
                    min-width: 150px;
                    font-weight: 500;
                }
                
                .gemini-composer-slider {
                    flex: 1;
                    margin-right: 10px;
                }
                
                .gemini-composer-option-value {
                    min-width: 30px;
                    text-align: right;
                }
                
                .gemini-composer-number-input {
                    width: 80px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-primary);
                    color: var(--text-normal);
                }
                
                .gemini-composer-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    justify-content: center;
                }
                
                .gemini-composer-generate-button {
                    display: flex !important;
                    align-items: center;
                    padding: 10px 20px !important;
                    border-radius: 8px;
                    font-weight: 500;
                    background-color: var(--interactive-accent) !important;
                    color: var(--text-on-accent) !important;
                    transition: all 0.2s ease;
                    flex-grow: 0;
                    min-width: 140px;
                    justify-content: center;
                }
                
                .gemini-composer-generate-button:hover {
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
                    flex-grow: 0;
                    min-width: 100px;
                    justify-content: center;
                }
                
                .gemini-composer-clear-button:hover {
                    background-color: var(--background-modifier-hover) !important;
                }
                
                .gemini-composer-button-icon {
                    margin-right: 8px;
                }
                
                .gemini-composer-presets {
                    margin-top: 12px;
                    border-top: 1px solid var(--background-modifier-border);
                    padding-top: 16px;
                }
                
                .gemini-composer-section-title {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--text-normal);
                }
                
                .gemini-composer-presets-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
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
                    height: 100%;
                }
                
                .gemini-composer-preset-btn:hover {
                    background-color: var(--background-modifier-hover);
                    border-color: var(--interactive-accent);
                }
                
                .gemini-composer-preset-icon {
                    font-size: 16px;
                    margin-right: 12px;
                    color: var(--text-accent);
                }
                
                .gemini-composer-preset-text {
                    font-weight: 500;
                }
                
                .gemini-composer-footer {
                    padding: 4px 12px;
                    border-top: 1px solid var(--background-modifier-border);
                    background-color: var(--background-secondary-alt);
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    min-height: 28px;
                }
                
                .gemini-composer-status {
                    display: flex;
                    align-items: center;
                    font-size: 0.75em;
                    color: var(--text-muted);
                }
                
                .gemini-composer-status:before {
                    content: "";
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    margin-right: 6px;
                    border-radius: 50%;
                    background-color: var(--text-success);
                }
                
                .gemini-composer-status.error:before {
                    background-color: var(--text-error);
                }
                
                /* Styles for the result modal */
                .gemini-result-modal {
                    max-width: 80vw;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .gemini-result-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    margin-bottom: 20px;
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 8px;
                    background-color: var(--background-secondary-alt);
                    max-height: 60vh;
                }
                
                .gemini-result-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .gemini-result-insert-btn,
                .gemini-result-copy-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .gemini-result-insert-btn {
                    background-color: var(--interactive-accent) !important;
                    color: var(--text-on-accent) !important;
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

    // Split the generateAndInsertContent method into two methods: generateContent and insertContent
    async generateContent(): Promise<void> {
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
            new Notice(`Generating content with Gemini...`);

            // Get advanced options values
            const advancedOptionsContent = document.querySelector('.gemini-composer-advanced-options');
            const temperature = advancedOptionsContent ? 
                parseFloat((advancedOptionsContent.querySelector('.gemini-composer-slider') as HTMLInputElement).value) : 0.7;
            const maxTokens = advancedOptionsContent ? 
                parseInt((advancedOptionsContent.querySelector('.gemini-composer-number-input') as HTMLInputElement).value) : 2048;

            // Generate the content using settings model
            const response = await this.geminiApiService.generateContent(prompt);
            
            // Show the result in a modal with insert/copy options
            this.showResultModal(response);
            
            // Keep the prompt for potential regeneration
            // this.clearPrompt(); - removed automatic clearing
            
        } catch (error) {
            new Notice(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.generatingContent = false;
        }
    }

    // New method to show the result in a modal
    showResultModal(content: string): void {
        const modal = new Modal(this.app);
        modal.titleEl.setText("Generated Content");
        
        const contentContainer = modal.contentEl.createDiv({ cls: "gemini-result-content" });
        contentContainer.innerHTML = content;
        
        const actionsContainer = modal.contentEl.createDiv({ cls: "gemini-result-actions" });
        
        // Add copy button
        const copyBtn = new ButtonComponent(actionsContainer)
            .setButtonText("Copy to Clipboard")
            .onClick(async () => {
                await navigator.clipboard.writeText(content);
                new Notice("Copied to clipboard!");
            });
        copyBtn.buttonEl.addClass("gemini-result-copy-btn");
        
        const copyIcon = document.createElement('span');
        setIcon(copyIcon, 'copy');
        copyIcon.style.marginRight = "8px";
        copyBtn.buttonEl.prepend(copyIcon);
        
        // Add insert button
        const insertBtn = new ButtonComponent(actionsContainer)
            .setButtonText("Insert into Note")
            .setCta()
            .onClick(() => {
                this.insertContent(content);
                modal.close();
            });
        insertBtn.buttonEl.addClass("gemini-result-insert-btn");
        
        const insertIcon = document.createElement('span');
        setIcon(insertIcon, 'arrow-down-into-line');
        insertIcon.style.marginRight = "8px";
        insertBtn.buttonEl.prepend(insertIcon);
        
        modal.contentEl.addClass("gemini-result-modal");
    }

    // Method to insert content into the editor
    async insertContent(content: string): Promise<void> {
        try {
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
                    editor.replaceRange(content, currentPos);
                    insertedSuccessfully = true;
                }
            }
            
            if (insertedSuccessfully) {
                new Notice('Content inserted successfully!');
            } else {
                // If no suitable editor was found, copy to clipboard
                await navigator.clipboard.writeText(content);
                new Notice('No active note found. Content copied to clipboard!');
            }
        } catch (error) {
            new Notice(`Error inserting content: ${error instanceof Error ? error.message : String(error)}`);
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

// Add a Modal class
class Modal {
    public contentEl: HTMLElement;
    public titleEl: HTMLElement;
    private modalEl: HTMLElement;
    private closeButton: HTMLElement;
    private app: any;

    constructor(app: any) {
        this.app = app;
        
        // Create modal container
        this.modalEl = document.createElement('div');
        this.modalEl.className = 'modal';
        
        // Create modal content
        this.contentEl = document.createElement('div');
        this.contentEl.className = 'modal-content';
        
        // Create title
        this.titleEl = document.createElement('h2');
        this.titleEl.className = 'modal-title';
        
        // Create close button
        this.closeButton = document.createElement('div');
        this.closeButton.className = 'modal-close-button';
        this.closeButton.innerHTML = '×';
        this.closeButton.addEventListener('click', () => this.close());
        
        // Assemble modal
        const titleContainer = document.createElement('div');
        titleContainer.className = 'modal-title-container';
        titleContainer.appendChild(this.titleEl);
        titleContainer.appendChild(this.closeButton);
        
        this.contentEl.appendChild(titleContainer);
        this.modalEl.appendChild(this.contentEl);
        document.body.appendChild(this.modalEl);
        
        // Add modal styles if not already present
        if (!document.getElementById('gemini-modal-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'gemini-modal-styles';
            styleEl.textContent = `
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background-color: var(--background-primary);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    width: 80%;
                    max-width: 800px;
                }
                
                .modal-title-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .modal-title {
                    margin: 0;
                    font-size: 1.5em;
                }
                
                .modal-close-button {
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--text-muted);
                }
                
                .modal-close-button:hover {
                    color: var(--text-normal);
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
    
    close(): void {
        this.modalEl.remove();
    }
} 