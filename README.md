# Gemini Writin Assistant for Obsidian


This plugin seamlessly integrates Google Gemini's generative AI capabilities into your Obsidian workflow, boosting productivity and creativity for personal knowledge management and writing.

---

## Features

- **Summarize Selection**: Quickly grasp the essence of lengthy note sections.  
- **Rephrase Selection**: Refine the clarity or tone of sentences or paragraphs.  
- **Tab Completion**: Press `Tab` at the end of a line for AI-suggested text completions.  
- **More Coming Soon**:  
  - Brainstorm ideas based on topics or headings.  
  - Continue writing when you're stuck.  
  - Ask targeted questions about selected text.  

---

## Installation

1. Open Obsidian and go to **Settings > Community plugins**.  
2. Disable **Safe mode**.  
3. Click **Browse**, search for "Gemini Assistant," and install it.  
4. Enable the plugin in the settings.  

---

## Configuration

1. Obtain a Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).  
2. In Obsidian, navigate to **Settings > Gemini Assistant**:  
   - Paste your Google Gemini API Key.  
   - Select your preferred Gemini model.  
   - Toggle Tab completion on or off.  

---

## Usage

### Summarize or Rephrase Text  
- Highlight text in your note.  
- Either:  
  - Right-click and choose an option (e.g., "Summarize with Gemini") from the context menu.  
  - Open the Command Palette (`Ctrl/Cmd+P`) and search for "Gemini" commands.  
- The AI-generated result will appear below your selection.  

### Tab Completion  
- Type some text in your note.  
- Place your cursor at the end of a line.  
- Press `Tab`.  
- Gemini will suggest a completion based on the context.  

---

## Security

Your API key is stored locally in your Obsidian configuration. While convenient, this isn't highly secure—anyone with filesystem access to your vault could potentially read it. Exercise caution with sensitive data.
