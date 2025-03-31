# Gemini Assistant for Obsidian

This plugin integrates Google Gemini's generative AI capabilities directly into the Obsidian editing workflow to enhance user productivity and creativity for personal knowledge management and writing.

## Features

- **Summarize Selection**: Quickly understand the gist of a long note section
- **Rephrase Selection**: Improve the clarity or tone of a sentence/paragraph
- **Tab Completion**: Use Tab at the end of a line to generate AI-suggested text completions
- **More Coming Soon**:
  - Brainstorm ideas related to a topic/heading
  - Continue writing when stuck
  - Ask specific questions about the selected text

## Installation

1. In Obsidian, go to Settings > Community plugins
2. Disable Safe mode
3. Click "Browse" and search for "Gemini Assistant"
4. Install the plugin
5. Enable the plugin

## Configuration

1. Obtain a Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
2. In Obsidian Settings > Gemini Assistant:
   - Enter your Google Gemini API Key
   - Select your preferred Gemini model
   - Enable/disable Tab completion

## Usage

1. **Summarize or Rephrase Text**:
   - Select text in your note
   - Either:
     - Right-click and choose an option from the context menu (e.g., "Summarize with Gemini")
     - Use the Command Palette (Ctrl/Cmd+P) and search for "Gemini"
   - The result will be inserted below your selection

2. **Tab Completion**:
   - Type some text in your note
   - Position your cursor at the end of a line
   - Press Tab
   - Gemini will generate a completion suggestion based on the context

## Security

Your API key is stored locally in your Obsidian configuration. While convenient, it's not highly secure (could be read if someone has filesystem access to your vault).

## License

MIT 