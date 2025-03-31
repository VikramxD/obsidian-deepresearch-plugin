import { App, ButtonComponent, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface GeminiAssistantSettings {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    contextSize: number;
}

export const DEFAULT_SETTINGS: GeminiAssistantSettings = {
    apiKey: '',
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2048,
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
    private plugin: Plugin;
    private settingsManager: SettingsManager;

    constructor(app: App, plugin: Plugin, settingsManager: SettingsManager) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = settingsManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // API Configuration section
        containerEl.createEl('h2', { text: 'API Configuration' });

        // API Key section with modern design
        const apiKeyContainer = containerEl.createDiv({ cls: 'gemini-api-key-container' });
        
        // API Key input with masked value and save button
        const apiKeyHeader = apiKeyContainer.createEl('div', { cls: 'gemini-api-key-header' });
        apiKeyHeader.createEl('span', { text: 'Google Gemini API Key', cls: 'gemini-api-key-title' });
        
        const apiKeySubtitle = apiKeyContainer.createEl('div', { text: 'Enter your API key from Google AI Studio', cls: 'gemini-api-key-subtitle' });
        
        const apiKeyInputContainer = apiKeyContainer.createEl('div', { cls: 'gemini-api-key-input-container' });
        
        // Create the masked input
        const apiKeyInput = apiKeyInputContainer.createEl('input', {
            type: 'password',
            cls: 'gemini-api-key-input',
            placeholder: 'Enter your API key...'
        });
        
        // Set the current value if it exists
        const currentSettings = this.settingsManager.getSettings();
        if (currentSettings.apiKey) {
            apiKeyInput.value = currentSettings.apiKey;
        }
        
        // Create the save button
        const saveButton = apiKeyInputContainer.createEl('button', {
            text: 'Save API Key',
            cls: 'gemini-api-key-save-btn'
        });
        
        // Handle save button click
        saveButton.addEventListener('click', async () => {
            const newApiKey = apiKeyInput.value.trim();
            if (newApiKey) {
                currentSettings.apiKey = newApiKey;
                await this.settingsManager.saveSettings();
                
                // Update API service
                this.plugin.geminiApiService.updateSettings(currentSettings);
                
                new Notice('API Key saved successfully');
                
                // Test connection with new key
                this.plugin.testApiConnection()
                    .then(success => {
                        if (success) {
                            new Notice('API connection verified');
                        } else {
                            new Notice('API connection test failed. Please check your key.');
                        }
                    })
                    .catch(error => {
                        new Notice(`API connection error: ${error instanceof Error ? error.message : String(error)}`);
                    });
            } else {
                new Notice('Please enter a valid API key');
            }
        });
        
        // Test API connection button
        const testButton = containerEl.createEl('button', {
            text: 'Test API Connection',
            cls: 'gemini-test-api-btn'
        });
        
        testButton.addEventListener('click', async () => {
            try {
                const isConnected = await this.plugin.testApiConnection();
                if (isConnected) {
                    new Notice('API connection successful!');
                } else {
                    new Notice('API connection failed. Please check your key.');
                }
            } catch (error) {
                new Notice(`API connection error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        // Model Settings section
        containerEl.createEl('h2', { text: 'Model Settings' });
        
        // Create model selection container
        const modelContainer = containerEl.createDiv({ cls: 'gemini-model-container' });
        modelContainer.createEl('div', { text: 'Gemini Model', cls: 'gemini-setting-label' });
        modelContainer.createEl('div', { text: 'Select the Gemini model to use for generating content', cls: 'gemini-setting-desc' });
        
        // Create the model dropdown with all latest models
        const modelSelect = modelContainer.createEl('select', { cls: 'gemini-model-select' });
        
        // Add model options based on the latest models from the screenshot
        const modelOptions = [
            { value: 'gemini-2.5-pro-exp-03-25', text: 'Gemini 2.5 Pro Experimental - Enhanced thinking and reasoning' },
            { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash - Next generation features, speed, thinking' },
            { value: 'gemini-2.0-flash-lite', text: 'Gemini 2.0 Flash-Lite - Cost efficiency and low latency' },
            { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash - Fast and versatile performance' },
            { value: 'gemini-1.5-flash-8b', text: 'Gemini 1.5 Flash-8B - High volume and lower intelligence tasks' },
            { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro - Complex reasoning tasks requiring more intelligence' },
            { value: 'gemini-1.0-pro', text: 'Gemini 1.0 Pro (Legacy)' },
            { value: 'gemini-1.0-pro-latest', text: 'Gemini 1.0 Pro Latest (Legacy)' },
            { value: 'gemini-1.0-pro-vision', text: 'Gemini 1.0 Pro Vision (Legacy)' }
        ];
        
        modelOptions.forEach(option => {
            const optEl = modelSelect.createEl('option', { 
                text: option.text,
                value: option.value
            });
            
            if (option.value === currentSettings.model) {
                optEl.selected = true;
            }
        });
        
        // Handle model selection change
        modelSelect.addEventListener('change', async () => {
            currentSettings.model = modelSelect.value;
            await this.settingsManager.saveSettings();
            
            // Update API service
            this.plugin.geminiApiService.updateSettings(currentSettings);
            
            // Update model info display
            updateModelInfo(modelSelect.value);
            
            new Notice(`Model changed to: ${modelSelect.value}`);
        });
        
        // Create model info container
        const modelInfoContainer = modelContainer.createDiv({ cls: 'gemini-model-info' });
        
        // Function to update the model info display
        const updateModelInfo = (modelValue: string) => {
            modelInfoContainer.empty();
            
            const selectedModel = modelOptions.find(m => m.value === modelValue);
            if (!selectedModel) return;
            
            let description = '';
            let capabilities = '';
            
            switch (modelValue) {
                case 'gemini-2.5-pro-exp-03-25':
                    description = 'Enhanced thinking and reasoning, multimodal understanding, advanced coding';
                    capabilities = 'Supports audio, images, videos, and text input';
                    break;
                case 'gemini-2.0-flash':
                    description = 'Next generation features, speed, thinking, realtime streaming';
                    capabilities = 'Supports text, images (experimental), and audio (coming soon) output';
                    break;
                case 'gemini-2.0-flash-lite':
                    description = 'Cost efficiency and low latency';
                    capabilities = 'Optimized for high volume and lower intelligence tasks';
                    break;
                case 'gemini-1.5-flash':
                    description = 'Fast and versatile performance across a diverse variety of tasks';
                    capabilities = 'Balanced multimodal model for most use cases';
                    break;
                case 'gemini-1.5-flash-8b':
                    description = 'High volume and lower intelligence tasks';
                    capabilities = 'Fastest and most cost-efficient model in the 1.5 family';
                    break;
                case 'gemini-1.5-pro':
                    description = 'Complex reasoning tasks requiring more intelligence';
                    capabilities = 'Best performing multimodal model with large context window';
                    break;
                default:
                    description = 'Legacy model with limited capabilities';
                    capabilities = 'May be deprecated in future updates';
            }
            
            modelInfoContainer.createEl('div', { text: description, cls: 'gemini-model-description' });
            modelInfoContainer.createEl('div', { text: capabilities, cls: 'gemini-model-capabilities' });
        };
        
        // Initialize model info display
        updateModelInfo(currentSettings.model);
        
        // Advanced Settings section
        containerEl.createEl('h2', { text: 'Advanced Settings' });
        
        // Temperature setting
        const tempContainer = containerEl.createDiv({ cls: 'gemini-setting-container' });
        tempContainer.createEl('div', { text: 'Temperature', cls: 'gemini-setting-label' });
        tempContainer.createEl('div', { text: 'Controls randomness: lower values are more focused, higher values more creative', cls: 'gemini-setting-desc' });
        
        const tempSliderContainer = tempContainer.createDiv({ cls: 'gemini-slider-container' });
        
        const tempSlider = tempSliderContainer.createEl('input', {
            type: 'range',
            cls: 'gemini-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.1',
                value: String(currentSettings.temperature || 0.7)
            }
        });
        
        const tempValue = tempSliderContainer.createEl('span', { 
            text: String(currentSettings.temperature || 0.7),
            cls: 'gemini-slider-value'
        });
        
        tempSlider.addEventListener('input', () => {
            tempValue.textContent = tempSlider.value;
        });
        
        tempSlider.addEventListener('change', async () => {
            currentSettings.temperature = parseFloat(tempSlider.value);
            await this.settingsManager.saveSettings();
        });
        
        // Max tokens setting
        const tokensContainer = containerEl.createDiv({ cls: 'gemini-setting-container' });
        tokensContainer.createEl('div', { text: 'Max Output Tokens', cls: 'gemini-setting-label' });
        tokensContainer.createEl('div', { text: 'Maximum number of tokens in generated response (1-8192)', cls: 'gemini-setting-desc' });
        
        const tokensInput = tokensContainer.createEl('input', {
            type: 'number',
            cls: 'gemini-number-input',
            value: String(currentSettings.maxTokens || 2048),
            attr: {
                min: '1',
                max: '8192',
                step: '1'
            }
        });
        
        tokensInput.addEventListener('change', async () => {
            const value = parseInt(tokensInput.value);
            if (!isNaN(value) && value >= 1 && value <= 8192) {
                currentSettings.maxTokens = value;
                await this.settingsManager.saveSettings();
            } else {
                tokensInput.value = String(currentSettings.maxTokens || 2048);
                new Notice('Please enter a valid token limit between 1 and 8192');
            }
        });
        
        // Add custom CSS for the settings UI
        containerEl.createEl('style', {
            text: `
                /* API Key styling */
                .gemini-api-key-container {
                    background-color: var(--background-secondary-alt);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }
                
                .gemini-api-key-header {
                    margin-bottom: 8px;
                }
                
                .gemini-api-key-title {
                    font-weight: 600;
                    font-size: 1.1em;
                }
                
                .gemini-api-key-subtitle {
                    font-size: 0.9em;
                    margin-bottom: 12px;
                    color: var(--text-muted);
                }
                
                .gemini-api-key-input-container {
                    display: flex;
                    gap: 8px;
                }
                
                .gemini-api-key-input {
                    flex: 1;
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-primary);
                    color: var(--text-normal);
                }
                
                .gemini-api-key-save-btn {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    background-color: var(--interactive-accent);
                    color: var(--text-on-accent);
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .gemini-test-api-btn {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-secondary);
                    color: var(--text-normal);
                    cursor: pointer;
                    margin-bottom: 24px;
                }
                
                /* Model Settings styling */
                .gemini-model-container {
                    margin-bottom: 24px;
                }
                
                .gemini-setting-label {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .gemini-setting-desc {
                    font-size: 0.9em;
                    color: var(--text-muted);
                    margin-bottom: 12px;
                }
                
                .gemini-model-select {
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-primary);
                    color: var(--text-normal);
                    margin-bottom: 12px;
                }
                
                .gemini-model-info {
                    background-color: var(--background-secondary-alt);
                    padding: 12px;
                    border-radius: 4px;
                    margin-top: 8px;
                    border-left: 3px solid var(--interactive-accent);
                }
                
                .gemini-model-description {
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                
                .gemini-model-capabilities {
                    font-size: 0.9em;
                    color: var(--text-muted);
                }
                
                /* Advanced Settings styling */
                .gemini-setting-container {
                    margin-bottom: 20px;
                }
                
                .gemini-slider-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .gemini-slider {
                    flex: 1;
                }
                
                .gemini-slider-value {
                    min-width: 30px;
                    text-align: center;
                }
                
                .gemini-number-input {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--background-modifier-border);
                    background-color: var(--background-primary);
                    color: var(--text-normal);
                    width: 100px;
                }
            `
        });
    }
} 