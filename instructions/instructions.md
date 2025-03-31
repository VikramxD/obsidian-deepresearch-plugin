

# I. Improved Product Requirements Document (PRD): "Gemini Assistant" for Obsidian

## 1. Introduction & Goals

- **Problem:** Obsidian users invest significant effort in writing, editing, summarizing, and brainstorming within their notes. While AI can enhance these tasks by improving efficiency, quality, and creativity, switching to external tools disrupts the workflow. Furthermore, users often need immediate, context-sensitive assistance at their current writing position to maintain flow and productivity.
- **Goal:** Seamlessly integrate Google Gemini's generative AI capabilities into Obsidian to provide a "Cursor Composer"-like experience, enabling real-time, cursor-position-aware writing and editing assistance within the editing workflow. This enhances productivity and creativity for personal knowledge management and writing.
- **Target User:** Individual Obsidian users seeking AI-driven support for writing, editing, and idea generation without leaving the app.
- **Value Proposition:** Save time, enhance writing quality, generate ideas, and receive interactive, context-aware assistance directly at the cursor, all within Obsidian, leveraging Gemini’s powerful AI capabilities.

---

## 2. User Goals & Use Cases (Examples)

- **Goal:** Quickly understand the gist of a long note section.
  - *Use Case:* Select a block of text → Right-click → Choose "Summarize with Gemini" → See a concise summary inserted below the selection.
- **Goal:** Improve the clarity or tone of a sentence/paragraph with options.
  - *Use Case:* Select text → Trigger command "Rephrase selection with Gemini" → View multiple rephrased options in a modal → Select one to replace the original text.
- **Goal:** Continue writing seamlessly when stuck.
  - *Use Case:* Place cursor at the end of a paragraph → Run "Continue writing with Gemini" → Get a relevant continuation sentence or paragraph inserted at the cursor.
- **Goal:** Brainstorm ideas related to a topic/heading.
  - *Use Case:* Place cursor under a heading → Trigger "Brainstorm ideas with Gemini" → Get a bulleted list of ideas inserted at the cursor.
- **Goal:** Ask a specific question about the selected text.
  - *Use Case:* Select text → Trigger "Ask Gemini about selection" → Enter question in a pop-up → See the answer inserted below.
- **Goal:** Configure the plugin with personal AI credentials.
  - *Use Case:* Go to Obsidian Settings → Plugin Options → Gemini Assistant → Enter Google AI Studio API Key → Select preferred Gemini model.
- **Goal:** Receive context-aware writing suggestions at the cursor.
  - *Use Case:* Pause typing with the cursor in a paragraph → Trigger "Smart Prompt with Gemini" → See a suggestion like "Continue this thought" or "Add an example" → Accept to insert the generated text.

---

## 3. Core Features (MVP - Minimum Viable Product)

### F1: Settings Configuration
- A dedicated settings tab in Obsidian’s settings.
- Input field for the Google Gemini API Key (from Google AI Studio), stored securely using Obsidian’s `loadData`/`saveData`, with basic UI masking (password field).
- Dropdown to select the Gemini model (e.g., `gemini-1.5-flash-latest`, `gemini-pro`). Default provided.
- Option to set context size (e.g., "last 500 characters" or "current paragraph") for cursor-based features.

### F2: API Interaction Service
- Internal module to construct and send requests to the Google Gemini API (`generativelanguage.googleapis.com`).
- Uses the API key and model from settings.
- Handles prompt submission and text response retrieval.
- Basic error handling for API calls (network errors, invalid key, rate limits).

### F3: Editor Integration - Text Selection & Cursor Actions
- Commands added to the Obsidian Command Palette (e.g., "Gemini: Summarize selection", "Gemini: Continue writing").
- Context menu options (right-click) for selected text actions (e.g., "Summarize with Gemini", "Rephrase with Gemini").
- Cursor-position-aware commands triggered via shortcuts or palette (e.g., "Continue writing with Gemini", "Smart Prompt with Gemini").

### F4: Core AI Actions (Predefined Prompts)
- **Summarize:** Sends selected text to Gemini with "Summarize this:" prompt.
- **Rephrase:** Sends selected text to Gemini with "Rephrase this text in multiple ways:" prompt, returning multiple options.
- **Continue Writing:** Takes text before the cursor (configurable context size) and sends it with "Continue this text naturally:" prompt.
- **Smart Prompt:** Analyzes text around the cursor (e.g., last sentence or paragraph) and suggests context-aware actions (e.g., "Continue this thought", "Provide an example").

### F5: Output Handling
- **Default Behavior:** Insert AI-generated text on a new line below the selection or at the cursor position.
- **Enhanced Rephrase:** Display multiple rephrased options in a modal; user selects one to replace the original text.
- **Smart Prompt:** Show suggestions in a small pop-up or inline; user accepts via shortcut or click to insert.
- **Feedback:** Use Obsidian `Notice` for status updates (e.g., "Contacting Gemini...", "Response inserted", "Error: Check API Key").

---

## 4. Future Considerations (Post-MVP)

- **Custom Prompts:** Modal for users to input custom instructions for selected text or cursor context.
- **Auto-Completion:** Real-time sentence or paragraph completion as the user types (requires streaming or frequent API calls).
- **More AI Actions:** "Check Grammar", "Change Tone", "Translate", "Brainstorm Ideas".
- **Flexible Output:** Options to replace text, insert as blockquote, copy to clipboard, or create a new note.
- **Streaming Responses:** Display long responses incrementally as they arrive from the API.
- **Context Awareness:** Include entire note or specific sections as context (with token limit management).
- **Parameter Tuning:** Adjust Gemini parameters (e.g., temperature, max tokens) in settings.
- **Error Handling:** Detailed error messages and recovery options.
- **Other AI Providers:** Abstract API service for future integration with OpenAI, Anthropic, etc.
- **Vertex AI Support:** Add support for Google Cloud Vertex AI endpoints.

---

## 5. Non-Goals (Initially)

- Real-time collaboration (e.g., multi-user cursors).
- Complex chat interface within Obsidian.
- Vector database or cross-note memory integration.
- Local AI model support.
- Extensive UI customization beyond Obsidian’s standard elements.

---

# II. Architecture Outline & Core Flows

## 1. Core Components (Conceptual Modules)

- **`main.ts` (Plugin Entry Point):**
  - Manages plugin lifecycle (`onload`, `onunload`).
  - Initializes components, registers commands, menu items, and settings tab.
  - Coordinates UI triggers with feature logic.
- **`SettingsManager`:**
  - Loads/saves settings (API key, model, context size) using `loadData`/`saveData`.
  - Provides synchronous access to settings for other modules.
- **`UISettingsTab` (Extends `PluginSettingTab`):**
  - Builds settings UI, populates fields from `SettingsManager`, and saves updates.
- **`GeminiAPIService`:**
  - Handles Gemini API communication (e.g., `generateContent(prompt)`).
  - Uses `requestUrl` for POST requests, parses responses, and manages errors.
  - Independent of editor logic.
- **`EditorService`:**
  - Manages editor interactions (e.g., `getSelectedText`, `getTextBeforeCursor`, `insertTextAtCursor`).
  - Independent of API logic.
- **`FeatureHandler`:**
  - Executes AI actions (e.g., `handleSummarize`, `handleContinueWriting`).
  - Uses `EditorService` for context, `SettingsManager` for config, and `GeminiAPIService` for responses.
  - Manages prompts, processes results, and provides user feedback via `Notice`.

## 2. Core User Flows (Example: Continue Writing)

1. **Trigger:** User places cursor at paragraph end → Triggers "Continue writing with Gemini" via command palette.
2. **Event:** Command is registered in `main.ts`.
3. **Orchestration:** `main.ts` calls `FeatureHandler.handleContinueWriting(editor)`.
4. **Context:** `EditorService.getTextBeforeCursor(editor)` retrieves prior text (e.g., last 500 characters).
5. **Config:** `SettingsManager` provides API key and model.
6. **Prompt:** `FeatureHandler` builds "Continue this text naturally:\n\n" + context.
7. **Feedback:** Shows `Notice("Contacting Gemini...")`.
8. **API Call:** `GeminiAPIService.generateContent(prompt)` sends request.
9. **Response:** Parses Gemini’s response and returns text or error.
10. **Result:** If successful, `EditorService.insertTextAtCursor(editor, result)` adds text; shows `Notice("Continuation inserted")`. If error, shows `Notice("Error: " + error.message)`.

## 3. Key Architectural Considerations

- **Modularity:** Separate API, editor, and settings logic for maintainability and extensibility.
- **Asynchronicity:** Use `async`/`await` for API calls and editor operations.
- **Error Handling:** Validate settings, handle API failures, and inform users clearly.
- **Performance:** Limit context size to manage token limits and latency; debounce API calls if auto-completion is added later.
- **Security:** Store API key locally with Obsidian’s mechanisms, noting filesystem access risks in documentation.

---

# III. Key Improvements for "Cursor Composer" Experience

1. **Continue Writing Feature:**
   - Adds direct cursor-position assistance, allowing users to extend their writing seamlessly.
2. **Enhanced Rephrase with Options:**
   - Provides interactive editing by offering multiple rephrasings, mimicking a composer-like choice process.
3. **Smart Prompt Feature:**
   - Introduces context-aware suggestions at the cursor, enhancing real-time creativity and flow.
4. **Foundation for Future Auto-Completion:**
   - Sets the stage for real-time suggestions (post-MVP) by integrating cursor-aware context handling.

These enhancements ensure the "Gemini Assistant" delivers a "Cursor Composer"-like experience, balancing MVP feasibility with innovative, interactive AI assistance within Obsidian.

--- 
