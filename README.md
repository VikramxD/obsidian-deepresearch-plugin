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

## Releasing

This plugin uses GitHub Actions to automate the release process. To release a new version:

1. Update the version number in `manifest.json` and `package.json`
2. Commit your changes: `git commit -am "Update to version X.X.X"`
3. Tag the new version: `git tag X.X.X`
4. Push the changes and tags: `git push && git push --tags`
5. GitHub Actions will automatically build the plugin and create a draft release
6. Go to the GitHub repository, edit the draft release, and publish it

When the release is published, users will be able to download the latest version of the plugin through Obsidian's community plugins browser. 