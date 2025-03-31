import { App, ButtonComponent, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface GeminiAssistantSettings {
    apiKey: string;
    modelName: string;
}

export const DEFAULT_SETTINGS: GeminiAssistantSettings = {
    apiKey: '',
    modelName: 'gemini-2.0-flash'
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

        containerEl.createEl('h2', { text: 'Gemini Assistant Settings' });

        // API Settings
        containerEl.createEl('h3', { text: 'API Configuration' });

        const apiKeySetting = new Setting(containerEl)
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
                return text;
            });
        
        // Add a save button specifically for the API key
        apiKeySetting.addButton(button => button
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
            })
        );
        
        // Add a test button to verify the API key works
        const testApiSection = containerEl.createDiv();
        testApiSection.addClass('setting-item');
        this.testButton = new ButtonComponent(testApiSection)
            .setButtonText('Test API Key')
            .setClass('mod-cta');
            
        // Add an ID attribute to the button element for easy selection
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
                }
            } catch (error) {
                new Notice(`API test failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        new Setting(containerEl)
            .setName('Gemini Model')
            .setDesc('Select the Gemini model to use')
            .addDropdown(dropdown => dropdown
                .addOption('gemini-2.5-pro-exp-03-25', 'Gemini 2.5 Pro Experimental (Most advanced)')
                .addOption('gemini-2.0-flash', 'Gemini 2.0 Flash (Recommended)')
                .addOption('gemini-2.0-flash-lite', 'Gemini 2.0 Flash-Lite (Fastest)')
                .setValue(this.settingsManager.settings.modelName)
                .onChange(async (value) => {
                    this.settingsManager.settings.modelName = value;
                    await this.settingsManager.saveSettings();
                })
            );
            
        // API Reference
        const apiInfoDiv = containerEl.createDiv();
        apiInfoDiv.createEl('p', { text: 'This plugin uses the latest Gemini API models. For more information, visit:' });
        const apiLink = apiInfoDiv.createEl('a', { 
            text: 'Google Gemini API Documentation',
            href: 'https://ai.google.dev/gemini-api/docs'
        });
        apiLink.setAttribute('target', '_blank');
    }
} 