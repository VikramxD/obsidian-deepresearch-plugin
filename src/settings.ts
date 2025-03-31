import { App, ButtonComponent, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface GeminiAssistantSettings {
    apiKey: string;
    modelName: string;
    contextSize: number;
}

export const DEFAULT_SETTINGS: GeminiAssistantSettings = {
    apiKey: '',
    modelName: 'gemini-1.5-flash',
    contextSize: 500
};

export class SettingsManager {
    plugin: Plugin;
    settings: GeminiAssistantSettings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    getSettings(): GeminiAssistantSettings {
        return this.settings;
    }
}

export class UISettingsTab extends PluginSettingTab {
    plugin: Plugin;
    settingsManager: SettingsManager;
    apiKeyInput: HTMLInputElement;
    testButton: ButtonComponent;

    constructor(app: App, plugin: Plugin, settingsManager: SettingsManager) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = settingsManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('gemini-settings');

        // Main heading
        containerEl.createEl('h2', { 
            text: 'Gemini Assistant Settings',
            cls: 'gemini-settings-title'
        });

        // Introduction and explanation
        const infoDiv = containerEl.createDiv({ cls: 'gemini-settings-info' });
        infoDiv.createEl('p', { 
            text: 'This plugin integrates Google\'s Gemini AI into Obsidian to provide writing assistance and content generation features.',
            cls: 'gemini-settings-description'
        });

        // API Settings section
        const apiSection = containerEl.createDiv({ cls: 'gemini-settings-section' });
        apiSection.createEl('h3', { 
            text: 'API Configuration',
            cls: 'gemini-settings-section-title'
        });

        // Add info about getting an API key
        const apiInfoDiv = apiSection.createDiv({ cls: 'gemini-settings-api-info' });
        apiInfoDiv.createEl('p', { text: 'To use this plugin, you need a Google Gemini API key:' });
        
        const instructionsList = apiInfoDiv.createEl('ol', { cls: 'gemini-settings-instructions' });
        instructionsList.createEl('li', { text: 'Go to Google AI Studio (https://aistudio.google.com/)' });
        instructionsList.createEl('li', { text: 'Sign in with your Google account' });
        instructionsList.createEl('li', { text: 'Navigate to "API keys" in the left sidebar or top menu' });
        instructionsList.createEl('li', { text: 'Create a new API key or use an existing one' });
        instructionsList.createEl('li', { text: 'Copy the API key and paste it below' });
        
        // API key setting with improved UI
        const apiKeyContainer = apiSection.createDiv({ cls: 'gemini-settings-api-key-container' });
        const apiKeySetting = new Setting(apiKeyContainer)
            .setName('Google Gemini API Key')
            .setDesc('Enter your API key from Google AI Studio')
            .addText(text => {
                this.apiKeyInput = text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.settingsManager.settings.apiKey)
                    .onChange(async (value) => {
                        this.settingsManager.settings.apiKey = value;
                    })
                    .inputEl;
                this.apiKeyInput.type = 'password';
                this.apiKeyInput.addClass('gemini-settings-api-input');
                return text;
            });
        
        // Add save button for API key with better styling
        apiKeySetting.addButton(button => {
            button
                .setButtonText('Save API Key')
                .setCta()
                .onClick(async () => {
                    if (!this.settingsManager.settings.apiKey) {
                        new Notice('Please enter an API key before saving');
                        return;
                    }
                    await this.settingsManager.saveSettings();
                    new Notice('API key saved successfully!');
                    
                    // Test the API key after saving
                    if (this.testButton) {
                        this.testButton.buttonEl.click();
                    }
                });
            button.buttonEl.addClass('gemini-settings-save-button');
            return button;
        });
        
        // Add eye icon to show/hide API key
        const showHideBtn = apiKeyContainer.createEl('button', {
            cls: 'gemini-settings-show-hide-btn',
            attr: {
                'aria-label': 'Show/hide API key',
                'type': 'button'
            }
        });
        showHideBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"></path></svg>';
        
        showHideBtn.addEventListener('click', () => {
            if (this.apiKeyInput.type === 'password') {
                this.apiKeyInput.type = 'text';
                showHideBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"></path></svg>';
            } else {
                this.apiKeyInput.type = 'password';
                showHideBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"></path></svg>';
            }
        });
        
        // Add a test button with better styling
        const testApiSection = apiSection.createDiv({ cls: 'gemini-settings-test-container' });
        testApiSection.createEl('p', { 
            text: 'Test your API key to ensure it\'s working correctly:',
            cls: 'gemini-settings-test-description'
        });
        
        this.testButton = new ButtonComponent(testApiSection)
            .setButtonText('Test API Key')
            .setClass('gemini-settings-test-button');
            
        this.testButton.buttonEl.id = 'gemini-test-btn';
        
        this.testButton.onClick(async () => {
            if (!this.settingsManager.settings.apiKey) {
                new Notice('Please enter and save an API key first');
                return;
            }
            
            new Notice('Testing API connection...');
            try {
                // @ts-ignore - We know the main plugin has a way to access the API service
                const testResult = await this.plugin.testApiConnection?.();
                if (testResult) {
                    new Notice('API connection successful! Your API key is working.');
                    const statusEl = testApiSection.createDiv({ cls: 'gemini-settings-status-success' });
                    statusEl.setText('✅ API connection successful! Your key is valid and working.');
                    // Remove the status after 10 seconds
                    setTimeout(() => statusEl.remove(), 10000);
                }
            } catch (error) {
                new Notice(`API test failed: ${error instanceof Error ? error.message : String(error)}`);
                const statusEl = testApiSection.createDiv({ cls: 'gemini-settings-status-error' });
                statusEl.setText(`❌ API test failed: ${error instanceof Error ? error.message : String(error)}`);
                // Remove the status after 10 seconds
                setTimeout(() => statusEl.remove(), 10000);
            }
        });

        // Model settings section
        const modelSection = containerEl.createDiv({ cls: 'gemini-settings-section' });
        modelSection.createEl('h3', { 
            text: 'Model Settings',
            cls: 'gemini-settings-section-title'
        });
        
        // Gemini model selection
        new Setting(modelSection)
            .setName('Gemini Model')
            .setDesc('Select the Gemini model to use for generating content')
            .addDropdown(dropdown => dropdown
                .addOption('gemini-1.5-pro', 'Gemini 1.5 Pro (Most capable)')
                .addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (Recommended)')
                .addOption('gemini-1.0-pro', 'Gemini 1.0 Pro (Legacy)')
                .setValue(this.settingsManager.settings.modelName)
                .onChange(async (value) => {
                    this.settingsManager.settings.modelName = value;
                    await this.settingsManager.saveSettings();
                    new Notice(`Gemini model set to: ${value}`);
                })
            );
        
        // Behavior settings section
        const behaviorSection = containerEl.createDiv({ cls: 'gemini-settings-section' });
        behaviorSection.createEl('h3', { 
            text: 'Behavior Settings',
            cls: 'gemini-settings-section-title'
        });
            
        new Setting(behaviorSection)
            .setName('Context Size')
            .setDesc('Number of characters to include as context for cursor-based features')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(this.settingsManager.settings.contextSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.settingsManager.settings.contextSize = value;
                    await this.settingsManager.saveSettings();
                })
            )
            .addExtraButton(button => button
                .setIcon('reset')
                .setTooltip('Reset to default (500)')
                .onClick(async () => {
                    this.settingsManager.settings.contextSize = 500;
                    await this.settingsManager.saveSettings();
                    this.display();
                })
            );
            
        // Resources section
        const resourcesSection = containerEl.createDiv({ cls: 'gemini-settings-section' });
        resourcesSection.createEl('h3', { 
            text: 'Resources',
            cls: 'gemini-settings-section-title'
        });
        
        const resourceLinks = resourcesSection.createDiv({ cls: 'gemini-settings-resource-links' });
        
        const createResourceLink = (text: string, url: string, description: string) => {
            const linkContainer = resourceLinks.createDiv({ cls: 'gemini-settings-resource-link' });
            const link = linkContainer.createEl('a', { 
                text: text,
                cls: 'gemini-settings-link',
                href: url
            });
            link.setAttribute('target', '_blank');
            linkContainer.createEl('p', { 
                text: description,
                cls: 'gemini-settings-link-description'
            });
        };
        
        createResourceLink(
            'Google Gemini API Documentation', 
            'https://ai.google.dev/gemini-api/docs', 
            'Official documentation for the Gemini API, including model capabilities and usage examples.'
        );
        
        createResourceLink(
            'Google AI Studio', 
            'https://aistudio.google.com/', 
            'Create and manage your API keys, and experiment with Gemini models directly.'
        );
        
        createResourceLink(
            'Plugin GitHub Repository', 
            'https://github.com/yourusername/obsidian-gemini-assistant', 
            'Report issues, request features, or contribute to the plugin development.'
        );
        
        // Add the CSS for styling
        containerEl.createEl('style', {
            text: `
                .gemini-settings {
                    padding: 0 10px;
                }
                
                .gemini-settings-title {
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--background-modifier-border);
                }
                
                .gemini-settings-info {
                    margin-bottom: 24px;
                    padding: 15px;
                    background: var(--background-secondary);
                    border-radius: 8px;
                }
                
                .gemini-settings-description {
                    margin: 0;
                    line-height: 1.5;
                }
                
                .gemini-settings-section {
                    margin-bottom: 32px;
                    padding: 16px;
                    background: var(--background-primary);
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 8px;
                }
                
                .gemini-settings-section-title {
                    margin-top: 0;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--background-modifier-border);
                }
                
                .gemini-settings-api-info {
                    margin-bottom: 16px;
                    padding: 12px;
                    background: var(--background-secondary);
                    border-radius: 6px;
                }
                
                .gemini-settings-instructions {
                    padding-left: 24px;
                    margin-bottom: 0;
                }
                
                .gemini-settings-instructions li {
                    margin-bottom: 6px;
                }
                
                .gemini-settings-instructions li:last-child {
                    margin-bottom: 0;
                }
                
                .gemini-settings-api-key-container {
                    position: relative;
                }
                
                .gemini-settings-api-input {
                    width: 100%;
                    font-family: monospace;
                    padding-right: 40px !important;
                }
                
                .gemini-settings-show-hide-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .gemini-settings-show-hide-btn:hover {
                    color: var(--text-normal);
                    background: var(--background-modifier-hover);
                }
                
                .gemini-settings-save-button {
                    font-weight: 600 !important;
                }
                
                .gemini-settings-test-container {
                    margin-top: 16px;
                    padding: 12px;
                    background: var(--background-secondary);
                    border-radius: 6px;
                }
                
                .gemini-settings-test-description {
                    margin-top: 0;
                    margin-bottom: 12px;
                }
                
                .gemini-settings-test-button {
                    background-color: var(--interactive-accent) !important;
                    color: var(--text-on-accent) !important;
                    font-weight: 600 !important;
                }
                
                .gemini-settings-status-success {
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: var(--background-modifier-success);
                    color: var(--text-success);
                    border-radius: 4px;
                }
                
                .gemini-settings-status-error {
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: var(--background-modifier-error);
                    color: var(--text-error);
                    border-radius: 4px;
                }
                
                .gemini-settings-resource-links {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .gemini-settings-resource-link {
                    padding: 12px;
                    background: var(--background-secondary);
                    border-radius: 6px;
                }
                
                .gemini-settings-link {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 600;
                    color: var(--interactive-accent);
                }
                
                .gemini-settings-link-description {
                    margin: 0;
                    color: var(--text-muted);
                    font-size: 0.9em;
                }
            `
        });
    }
} 